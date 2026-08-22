import 'server-only';

import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowAdmin } from './admin-data';
import {
  canAccessNowTable,
  NOW_TABLES,
  type NowAdminGroup,
  type NowTableDefinition,
} from './table-registry';

export type NowSectionTableSummary = {
  definition: NowTableDefinition;
  count: number;
  error: string | null;
};

export async function getNowSectionOverview(group: NowAdminGroup) {
  const { access } = await requireNowAdmin();
  const definitions = NOW_TABLES.filter(
    (table) => table.group === group && canAccessNowTable(access, table),
  );

  if (definitions.length === 0) {
    redirect('/admin/unauthorized');
  }

  const admin = createAdminClient();
  const tables = await Promise.all(
    definitions.map(async (definition): Promise<NowSectionTableSummary> => {
      const { count, error } = await admin
        .schema('now')
        .from(definition.table)
        .select('*', { count: 'exact', head: true });

      return {
        definition,
        count: count ?? 0,
        error: error?.message ?? null,
      };
    }),
  );

  return {
    access,
    tables,
    totalRecords: tables.reduce((sum, table) => sum + table.count, 0),
  };
}
