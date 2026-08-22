'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { getNowTableColumns, requireNowTableAccess } from '../lib/table-data';
import type { NowTableDefinition } from '../lib/table-registry';

type FormKind = 'boolean' | 'number' | 'json' | 'time' | 'datetime' | 'textarea' | 'url' | 'email' | 'phone' | 'text';

function normalizeString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label}: البيانات غير صالحة.`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}: صيغة البيانات غير صحيحة.`);
  }
  return parsed as Record<string, unknown>;
}

function stripManagedColumns(definition: NowTableDefinition, payload: Record<string, unknown>, mode: 'insert' | 'update') {
  const clean = { ...payload };
  delete clean.created_at;
  delete clean.updated_at;

  for (const column of definition.protectedColumns ?? []) delete clean[column];
  if (mode === 'update') for (const column of definition.primaryKey) delete clean[column];

  if (
    mode === 'insert' &&
    definition.primaryKey.length === 1 &&
    definition.primaryKey[0] === 'id' &&
    (clean.id === null || clean.id === undefined || clean.id === '')
  ) {
    delete clean.id;
  }
  return clean;
}

function redirectWithMessage(tableName: string, kind: 'success' | 'error', message: string): never {
  redirect(`/admin/now/data/${tableName}?${kind}=${encodeURIComponent(message)}`);
}

function getMutationError(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ التعديل.';
}

function parseFriendlyPayload(formData: FormData, allowedColumns: Set<string>, mode: 'insert' | 'update') {
  const payload: Record<string, unknown> = {};

  for (const [key, rawKind] of formData.entries()) {
    if (!key.startsWith('field_kind__') || typeof rawKind !== 'string') continue;
    const column = key.slice('field_kind__'.length);
    if (!allowedColumns.has(column)) continue;

    const kind = rawKind as FormKind;
    const raw = formData.get(`field__${column}`);
    const text = typeof raw === 'string' ? raw.trim() : '';

    if (kind === 'boolean') {
      payload[column] = raw === 'on';
      continue;
    }

    if (text === '') {
      if (mode === 'update') payload[column] = null;
      continue;
    }

    if (kind === 'number') {
      const number = Number(text);
      if (!Number.isFinite(number)) throw new Error(`قيمة ${column} يجب أن تكون رقمًا.`);
      payload[column] = number;
      continue;
    }

    if (kind === 'json') {
      try {
        payload[column] = JSON.parse(text);
      } catch {
        throw new Error(`البيانات المتقدمة في ${column} غير صالحة.`);
      }
      continue;
    }

    payload[column] = text;
  }

  return payload;
}

function revalidateTable(tableName: string) {
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/data');
  revalidatePath(`/admin/now/data/${tableName}`);
  revalidatePath('/admin/now/sections/catalog');
  revalidatePath('/admin/now/sections/marketing');
  revalidatePath('/admin/now/sections/geography');
  revalidatePath('/admin/now/sections/payments');
  revalidatePath('/admin/now/sections/services');
  revalidatePath('/admin/now/sections/system');
}

export async function createNowTableRowFromForm(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));
  try {
    const { definition, access } = await requireNowTableAccess(tableName, true);
    if (definition.mutationMode !== 'crud') throw new Error('هذه البيانات لا تسمح بإضافة سجل مباشر.');

    const columns = await getNowTableColumns(tableName);
    const allowedColumns = new Set(columns.map((column) => column.column_name));
    const payload = stripManagedColumns(definition, parseFriendlyPayload(formData, allowedColumns, 'insert'), 'insert');
    if (definition.table === 'admin_members') payload.created_by = access.user_id;

    const admin = createAdminClient();
    const { error } = await admin.schema('now').from(definition.table).insert(payload);
    if (error) throw new Error(getMutationError(error));
  } catch (error) {
    redirectWithMessage(tableName, 'error', error instanceof Error ? error.message : 'تعذر إضافة البيانات.');
  }

  revalidateTable(tableName);
  redirectWithMessage(tableName, 'success', 'تمت الإضافة بنجاح.');
}

export async function updateNowTableRowFromForm(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));
  try {
    const { definition } = await requireNowTableAccess(tableName, true);
    const primaryKey = parseObject(normalizeString(formData.get('primary_key')), 'السجل');
    const columns = await getNowTableColumns(tableName);
    const allowedColumns = new Set(columns.map((column) => column.column_name));
    const payload = stripManagedColumns(definition, parseFriendlyPayload(formData, allowedColumns, 'update'), 'update');

    for (const column of definition.primaryKey) {
      if (primaryKey[column] === null || primaryKey[column] === undefined || primaryKey[column] === '') {
        throw new Error('تعذر تحديد السجل المطلوب تعديله.');
      }
    }
    if (Object.keys(payload).length === 0) throw new Error('لا توجد تعديلات للحفظ.');

    const admin = createAdminClient();
    let query = admin.schema('now').from(definition.table).update(payload);
    for (const column of definition.primaryKey) query = query.eq(column, primaryKey[column]);
    const { error } = await query;
    if (error) throw new Error(getMutationError(error));
  } catch (error) {
    redirectWithMessage(tableName, 'error', error instanceof Error ? error.message : 'تعذر حفظ التعديلات.');
  }

  revalidateTable(tableName);
  redirectWithMessage(tableName, 'success', 'تم حفظ التعديلات.');
}

export async function createNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));
  try {
    const { definition, access } = await requireNowTableAccess(tableName, true);
    if (definition.mutationMode !== 'crud') throw new Error('هذه البيانات لا تسمح بالإضافة المباشرة.');
    const payload = stripManagedColumns(definition, parseObject(normalizeString(formData.get('payload')), 'السجل'), 'insert');
    if (definition.table === 'admin_members') payload.created_by = access.user_id;
    const admin = createAdminClient();
    const { error } = await admin.schema('now').from(definition.table).insert(payload);
    if (error) throw new Error(getMutationError(error));
  } catch (error) {
    redirectWithMessage(tableName, 'error', error instanceof Error ? error.message : 'تعذر إنشاء السجل.');
  }
  revalidateTable(tableName);
  redirectWithMessage(tableName, 'success', 'تم إنشاء السجل بنجاح.');
}

export async function updateNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));
  try {
    const { definition } = await requireNowTableAccess(tableName, true);
    const primaryKey = parseObject(normalizeString(formData.get('primary_key')), 'السجل');
    const payload = stripManagedColumns(definition, parseObject(normalizeString(formData.get('payload')), 'السجل'), 'update');
    if (Object.keys(payload).length === 0) throw new Error('لا توجد حقول قابلة للتحديث.');
    const admin = createAdminClient();
    let query = admin.schema('now').from(definition.table).update(payload);
    for (const column of definition.primaryKey) query = query.eq(column, primaryKey[column]);
    const { error } = await query;
    if (error) throw new Error(getMutationError(error));
  } catch (error) {
    redirectWithMessage(tableName, 'error', error instanceof Error ? error.message : 'تعذر تحديث السجل.');
  }
  revalidateTable(tableName);
  redirectWithMessage(tableName, 'success', 'تم تحديث السجل بنجاح.');
}

export async function deleteNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));
  try {
    const { definition, access } = await requireNowTableAccess(tableName, true);
    if (definition.mutationMode !== 'crud') throw new Error('هذه البيانات لا تسمح بالحذف المباشر.');
    const primaryKey = parseObject(normalizeString(formData.get('primary_key')), 'السجل');
    if (definition.table === 'admin_members' && primaryKey.user_id === access.user_id) {
      throw new Error('لا يمكنك حذف حساب الإدارة الذي تستخدمه الآن.');
    }

    const admin = createAdminClient();
    let query = admin.schema('now').from(definition.table).delete();
    for (const column of definition.primaryKey) {
      if (primaryKey[column] === null || primaryKey[column] === undefined || primaryKey[column] === '') {
        throw new Error('تعذر تحديد السجل المطلوب حذفه.');
      }
      query = query.eq(column, primaryKey[column]);
    }
    const { error } = await query;
    if (error) throw new Error(getMutationError(error));
  } catch (error) {
    redirectWithMessage(tableName, 'error', error instanceof Error ? error.message : 'تعذر حذف السجل.');
  }
  revalidateTable(tableName);
  redirectWithMessage(tableName, 'success', 'تم حذف السجل.');
}
