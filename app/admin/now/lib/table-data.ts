import 'server-only';

import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowAdmin } from './admin-data';
import {
  canAccessNowTable,
  canMutateNowTable,
  getNowTableDefinition,
  type NowTableDefinition,
} from './table-registry';

export type NowAdminRow = Record<string, unknown>;

export type NowSchemaTable = {
  table_name: string;
  primary_key_columns: string[];
  column_names: string[];
};

function getErrorMessage(error: { message?: string; details?: string } | null) {
  return [error?.message, error?.details].filter(Boolean).join(' — ') || 'تعذر تحميل البيانات.';
}

async function loadNowSchemaCatalog(
  context: Awaited<ReturnType<typeof requireNowAdmin>>,
) {
  const { data, error } = await context.supabase
    .schema('now')
    .rpc('get_admin_schema_catalog');

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as NowSchemaTable[];
}

export async function getNowSchemaCatalog() {
  const context = await requireNowAdmin();
  return loadNowSchemaCatalog(context);
}

function createUnregisteredTableDefinition(
  schemaTable: NowSchemaTable,
): NowTableDefinition {
  const primaryKey = schemaTable.primary_key_columns ?? [];
  const columns = schemaTable.column_names ?? [];
  const fallbackColumn = primaryKey[0] ?? columns[0] ?? 'id';

  return {
    table: schemaTable.table_name,
    labelAr: `جدول غير مسجل: ${schemaTable.table_name}`,
    descriptionAr:
      'تم اكتشاف هذا الجدول تلقائيًا في schema now لكنه غير موجود بعد في Admin Registry. يظهر للـmanage_settings كقراءة فقط حتى يتم تصنيفه وتحديد صلاحيات التعديل الآمنة.',
    group: 'system',
    permission: 'manage_settings',
    mutationMode: 'readonly',
    primaryKey: primaryKey.length > 0 ? primaryKey : [fallbackColumn],
    titleColumns: primaryKey.length > 0 ? primaryKey : [fallbackColumn],
    orderBy: fallbackColumn,
    orderAscending: true,
  };
}

export async function resolveNowTableAccess(tableName: string) {
  const context = await requireNowAdmin();
  const registered = getNowTableDefinition(tableName);

  if (registered) {
    if (!canAccessNowTable(context.access, registered)) {
      redirect('/admin/unauthorized');
    }

    return {
      ...context,
      definition: registered,
      isRegistered: true,
    };
  }

  if (!context.access.permissions.manage_settings) {
    redirect('/admin/unauthorized');
  }

  const catalog = await loadNowSchemaCatalog(context);
  const schemaTable = catalog.find((table) => table.table_name === tableName);

  if (!schemaTable) {
    return null;
  }

  return {
    ...context,
    definition: createUnregisteredTableDefinition(schemaTable),
    isRegistered: false,
  };
}

export async function requireNowTableAccess(tableName: string, mutation = false) {
  const resolved = await resolveNowTableAccess(tableName);

  if (!resolved) {
    throw new Error('unknown_navienty_now_table');
  }

  const allowed = mutation
    ? resolved.isRegistered && canMutateNowTable(resolved.access, resolved.definition)
    : canAccessNowTable(resolved.access, resolved.definition);

  if (!allowed) {
    redirect('/admin/unauthorized');
  }

  return resolved;
}

export async function getAdminTableRows(input: {
  tableName: string;
  page?: number;
  pageSize?: number;
  search?: string | null;
}) {
  const { definition, isRegistered } = await requireNowTableAccess(input.tableName);
  const admin = createAdminClient();
  const pageSize = Math.min(Math.max(input.pageSize ?? 50, 10), 100);
  const page = Math.max(input.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .schema('now')
    .from(definition.table)
    .select('*', { count: 'exact' })
    .order(definition.orderBy, {
      ascending: definition.orderAscending ?? false,
    })
    .range(from, to);

  const search = input.search?.trim();

  if (search && definition.searchColumn) {
    query = query.ilike(definition.searchColumn, `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    definition,
    isRegistered,
    rows: (data ?? []) as NowAdminRow[],
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    },
  };
}

export function getRowPrimaryKey(
  definition: NowTableDefinition,
  row: NowAdminRow,
) {
  return Object.fromEntries(
    definition.primaryKey.map((column) => [column, row[column]]),
  );
}

export function getRowTitle(
  definition: NowTableDefinition,
  row: NowAdminRow,
) {
  const values = definition.titleColumns
    .map((column) => row[column])
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value));

  return values.length > 0 ? values.join(' · ') : JSON.stringify(getRowPrimaryKey(definition, row));
}

export function getCreateTemplate(definition: NowTableDefinition) {
  return Object.fromEntries(
    (definition.requiredColumns ?? []).map((column) => [column, null]),
  );
}
