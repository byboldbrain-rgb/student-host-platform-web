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

export type NowTableColumn = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: boolean;
  column_default: string | null;
  ordinal_position: number;
};

export type RelationOption = { value: string; label: string };
export type RelationOptionsMap = Record<string, RelationOption[]>;

type RelationSpec = { table: string; value: string; labels: string[] };

const RELATION_SPECS: Record<string, Record<string, RelationSpec>> = {
  stores: {
    category_id: { table: 'store_categories', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    city_id: { table: 'cities', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  store_business_hours: { store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] } },
  store_service_areas: {
    store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    service_area_id: { table: 'service_areas', value: 'id', labels: ['name_ar', 'name_en', 'code'] },
  },
  catalog_categories: {
    store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    parent_id: { table: 'catalog_categories', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  products: {
    store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    catalog_category_id: { table: 'catalog_categories', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  product_variants: { product_id: { table: 'products', value: 'id', labels: ['name_ar', 'name_en', 'sku'] } },
  product_images: { product_id: { table: 'products', value: 'id', labels: ['name_ar', 'name_en', 'sku'] } },
  home_banners: {
    store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    service_package_id: { table: 'service_packages', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  home_banner_images: { banner_id: { table: 'home_banners', value: 'id', labels: ['admin_label', 'placement'] } },
  home_banner_products: {
    banner_id: { table: 'home_banners', value: 'id', labels: ['admin_label', 'placement'] },
    product_id: { table: 'products', value: 'id', labels: ['name_ar', 'name_en', 'sku'] },
  },
  home_banner_service_areas: {
    banner_id: { table: 'home_banners', value: 'id', labels: ['admin_label', 'placement'] },
    service_area_id: { table: 'service_areas', value: 'id', labels: ['name_ar', 'name_en', 'code'] },
  },
  vouchers: {
    store_id: { table: 'stores', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
    category_id: { table: 'store_categories', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  voucher_categories: {
    voucher_id: { table: 'vouchers', value: 'id', labels: ['code', 'title_ar'] },
    category_id: { table: 'store_categories', value: 'id', labels: ['name_ar', 'name_en', 'slug'] },
  },
  service_areas: { city_id: { table: 'cities', value: 'id', labels: ['name_ar', 'name_en', 'slug'] } },
  payment_method_accounts: { payment_method_id: { table: 'payment_methods', value: 'id', labels: ['name_ar', 'name_en', 'code'] } },
};

function getErrorMessage(error: { message?: string; details?: string } | null) {
  return [error?.message, error?.details].filter(Boolean).join(' — ') || 'تعذر تحميل البيانات.';
}

async function loadNowSchemaCatalog(context: Awaited<ReturnType<typeof requireNowAdmin>>) {
  const { data, error } = await context.supabase.schema('now').rpc('get_admin_schema_catalog');
  if (error) throw new Error(getErrorMessage(error));
  return (data ?? []) as NowSchemaTable[];
}

export async function getNowSchemaCatalog() {
  const context = await requireNowAdmin();
  return loadNowSchemaCatalog(context);
}

function createUnregisteredTableDefinition(schemaTable: NowSchemaTable): NowTableDefinition {
  const primaryKey = schemaTable.primary_key_columns ?? [];
  const columns = schemaTable.column_names ?? [];
  const fallbackColumn = primaryKey[0] ?? columns[0] ?? 'id';
  return {
    table: schemaTable.table_name,
    labelAr: `بيانات جديدة: ${schemaTable.table_name}`,
    descriptionAr: 'مصدر بيانات جديد تم اكتشافه تلقائيًا. متاح للمشاهدة فقط حتى يتم تحديد طريقة إدارته الآمنة.',
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
    if (!canAccessNowTable(context.access, registered)) redirect('/admin/unauthorized');
    return { ...context, definition: registered, isRegistered: true };
  }
  if (!context.access.permissions.manage_settings) redirect('/admin/unauthorized');
  const catalog = await loadNowSchemaCatalog(context);
  const schemaTable = catalog.find((item) => item.table_name === tableName);
  if (!schemaTable) return null;
  return { ...context, definition: createUnregisteredTableDefinition(schemaTable), isRegistered: false };
}

export async function requireNowTableAccess(tableName: string, mutation = false) {
  const resolved = await resolveNowTableAccess(tableName);
  if (!resolved) throw new Error('unknown_navienty_now_table');
  const allowed = mutation
    ? resolved.isRegistered && canMutateNowTable(resolved.access, resolved.definition)
    : canAccessNowTable(resolved.access, resolved.definition);
  if (!allowed) redirect('/admin/unauthorized');
  return resolved;
}

export async function getNowTableColumns(tableName: string) {
  const resolved = await requireNowTableAccess(tableName);
  const { data, error } = await resolved.supabase.schema('now').rpc('get_admin_table_columns', { p_table_name: tableName });
  if (error) throw new Error(getErrorMessage(error));
  return (data ?? []) as NowTableColumn[];
}

function relationLabel(row: NowAdminRow, labels: string[]) {
  const parts = labels.map((column) => row[column]).filter((value) => value !== null && value !== undefined && value !== '').map(String);
  return parts.slice(0, 2).join(' · ');
}

export async function getNowRelationOptions(tableName: string): Promise<RelationOptionsMap> {
  await requireNowTableAccess(tableName);
  const specs = RELATION_SPECS[tableName];
  if (!specs) return {};
  const admin = createAdminClient();
  const entries = await Promise.all(Object.entries(specs).map(async ([column, spec]) => {
    const selectColumns = Array.from(new Set([spec.value, ...spec.labels])).join(',');
    const { data, error } = await admin.schema('now').from(spec.table).select(selectColumns).limit(500);
    if (error) return [column, []] as const;
    const rows = (data ?? []) as unknown as NowAdminRow[];
    const options = rows
      .map((row) => ({ value: String(row[spec.value] ?? ''), label: relationLabel(row, spec.labels) || String(row[spec.value] ?? '') }))
      .filter((option) => option.value)
      .sort((a, b) => a.label.localeCompare(b.label, 'ar'));
    return [column, options] as const;
  }));
  return Object.fromEntries(entries);
}

export async function getAdminTableRows(input: { tableName: string; page?: number; pageSize?: number; search?: string | null }) {
  const { definition, isRegistered } = await requireNowTableAccess(input.tableName);
  const admin = createAdminClient();
  const pageSize = Math.min(Math.max(input.pageSize ?? 30, 10), 100);
  const page = Math.max(input.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = admin.schema('now').from(definition.table).select('*', { count: 'exact' }).order(definition.orderBy, { ascending: definition.orderAscending ?? false }).range(from, to);
  const search = input.search?.trim();
  if (search && definition.searchColumn) query = query.ilike(definition.searchColumn, `%${search}%`);
  const { data, error, count } = await query;
  if (error) throw new Error(getErrorMessage(error));
  return {
    definition,
    isRegistered,
    rows: (data ?? []) as NowAdminRow[],
    pagination: { page, pageSize, total: count ?? 0, pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)) },
  };
}

export function getRowPrimaryKey(definition: NowTableDefinition, row: NowAdminRow) {
  return Object.fromEntries(definition.primaryKey.map((column) => [column, row[column]]));
}

export function getRowTitle(definition: NowTableDefinition, row: NowAdminRow) {
  const values = definition.titleColumns.map((column) => row[column]).filter((value) => value !== null && value !== undefined && value !== '').map(String);
  return values.length > 0 ? values.join(' · ') : 'سجل بدون عنوان';
}

export function getCreateTemplate(definition: NowTableDefinition) {
  return Object.fromEntries((definition.requiredColumns ?? []).map((column) => [column, null]));
}
