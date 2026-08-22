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

function getErrorMessage(error: { message?: string; details?: string } | null) {
  return [error?.message, error?.details].filter(Boolean).join(' — ') || 'تعذر تحميل البيانات.';
}

export async function requireNowTableAccess(tableName: string, mutation = false) {
  const definition = getNowTableDefinition(tableName);

  if (!definition) {
    throw new Error('unknown_navienty_now_table');
  }

  const context = await requireNowAdmin();
  const allowed = mutation
    ? canMutateNowTable(context.access, definition)
    : canAccessNowTable(context.access, definition);

  if (!allowed) {
    redirect('/admin/unauthorized');
  }

  return {
    ...context,
    definition,
  };
}

export async function getAdminTableRows(input: {
  tableName: string;
  page?: number;
  pageSize?: number;
  search?: string | null;
}) {
  const { definition } = await requireNowTableAccess(input.tableName);
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
