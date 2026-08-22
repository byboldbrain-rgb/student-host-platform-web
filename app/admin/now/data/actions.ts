'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../lib/table-data';
import type { NowTableDefinition } from '../lib/table-registry';

function normalizeString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label}: JSON غير صالح.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}: يجب أن تكون القيمة JSON Object.`);
  }

  return parsed as Record<string, unknown>;
}

function stripManagedColumns(
  definition: NowTableDefinition,
  payload: Record<string, unknown>,
  mode: 'insert' | 'update',
) {
  const clean = { ...payload };

  delete clean.created_at;
  delete clean.updated_at;

  for (const column of definition.protectedColumns ?? []) {
    delete clean[column];
  }

  if (mode === 'update') {
    for (const column of definition.primaryKey) {
      delete clean[column];
    }
  }

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

export async function createNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));

  try {
    const { definition, access } = await requireNowTableAccess(tableName, true);

    if (definition.mutationMode !== 'crud') {
      throw new Error('هذا الجدول لا يسمح بإنشاء سجلات مباشرة من Data Manager.');
    }

    const rawPayload = normalizeString(formData.get('payload'));
    const payload = stripManagedColumns(definition, parseObject(rawPayload, 'السجل'), 'insert');

    if (definition.table === 'admin_members') {
      payload.created_by = access.user_id;
    }

    const admin = createAdminClient();
    const { error } = await admin.schema('now').from(definition.table).insert(payload);

    if (error) {
      throw new Error(getMutationError(error));
    }
  } catch (error) {
    redirectWithMessage(
      tableName,
      'error',
      error instanceof Error ? error.message : 'تعذر إنشاء السجل.',
    );
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/data');
  revalidatePath(`/admin/now/data/${tableName}`);
  redirectWithMessage(tableName, 'success', 'تم إنشاء السجل بنجاح.');
}

export async function updateNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));

  try {
    const { definition } = await requireNowTableAccess(tableName, true);
    const primaryKey = parseObject(normalizeString(formData.get('primary_key')), 'المفتاح الأساسي');
    const payload = stripManagedColumns(
      definition,
      parseObject(normalizeString(formData.get('payload')), 'السجل'),
      'update',
    );

    for (const column of definition.primaryKey) {
      if (primaryKey[column] === null || primaryKey[column] === undefined || primaryKey[column] === '') {
        throw new Error(`المفتاح الأساسي ${column} مفقود.`);
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('لا توجد حقول قابلة للتحديث.');
    }

    const admin = createAdminClient();
    let query = admin.schema('now').from(definition.table).update(payload);

    for (const column of definition.primaryKey) {
      query = query.eq(column, primaryKey[column]);
    }

    const { error } = await query;

    if (error) {
      throw new Error(getMutationError(error));
    }
  } catch (error) {
    redirectWithMessage(
      tableName,
      'error',
      error instanceof Error ? error.message : 'تعذر تحديث السجل.',
    );
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/data');
  revalidatePath(`/admin/now/data/${tableName}`);
  redirectWithMessage(tableName, 'success', 'تم تحديث السجل بنجاح.');
}

export async function deleteNowTableRow(formData: FormData) {
  const tableName = normalizeString(formData.get('table'));

  try {
    const { definition, access } = await requireNowTableAccess(tableName, true);

    if (definition.mutationMode !== 'crud') {
      throw new Error('هذا الجدول لا يسمح بالحذف المباشر.');
    }

    const primaryKey = parseObject(normalizeString(formData.get('primary_key')), 'المفتاح الأساسي');

    if (definition.table === 'admin_members' && primaryKey.user_id === access.user_id) {
      throw new Error('لا يمكنك حذف عضويتك الإدارية الحالية من نفس الجلسة.');
    }

    const admin = createAdminClient();
    let query = admin.schema('now').from(definition.table).delete();

    for (const column of definition.primaryKey) {
      if (primaryKey[column] === null || primaryKey[column] === undefined || primaryKey[column] === '') {
        throw new Error(`المفتاح الأساسي ${column} مفقود.`);
      }

      query = query.eq(column, primaryKey[column]);
    }

    const { error } = await query;

    if (error) {
      throw new Error(getMutationError(error));
    }
  } catch (error) {
    redirectWithMessage(
      tableName,
      'error',
      error instanceof Error ? error.message : 'تعذر حذف السجل.',
    );
  }

  revalidatePath('/admin/now');
  revalidatePath('/admin/now/data');
  revalidatePath(`/admin/now/data/${tableName}`);
  redirectWithMessage(tableName, 'success', 'تم حذف السجل.');
}
