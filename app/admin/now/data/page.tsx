import Link from 'next/link';
import { ArrowLeft, Database, ShieldCheck } from 'lucide-react';

import { requireNowAdmin } from '../lib/admin-data';
import {
  canAccessNowTable,
  NOW_ADMIN_GROUPS,
  NOW_TABLES,
  type NowAdminGroup,
} from '../lib/table-registry';

function isGroup(value: string | undefined): value is NowAdminGroup {
  return Boolean(value && Object.prototype.hasOwnProperty.call(NOW_ADMIN_GROUPS, value));
}

export default async function NavientyNowDataIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { access } = await requireNowAdmin();
  const params = await searchParams;
  const activeGroup = isGroup(params.group) ? params.group : null;
  const visibleTables = NOW_TABLES.filter(
    (definition) =>
      canAccessNowTable(access, definition) &&
      (!activeGroup || definition.group === activeGroup),
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-l from-violet-50 via-white to-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                <Database size={14} />
                Advanced Database Manager
              </div>
              <h2 className="text-2xl font-black sm:text-3xl">
                كل بيانات Navienty Now
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                هذه الواجهة مرتبطة بقائمة كاملة لكل جداول schema now. الجداول التشغيلية الحساسة
                تظهر للقراءة والمراجعة فقط، بينما جداول المحتوى والإعدادات تسمح بعمليات CRUD حسب
                صلاحيتك.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-black">
                <ShieldCheck size={17} />
                {visibleTables.length} جدول متاح بصلاحيتك
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4 sm:p-6">
          <Link
            href="/admin/now/data"
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              !activeGroup
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            كل الجداول
          </Link>

          {(Object.entries(NOW_ADMIN_GROUPS) as Array<
            [NowAdminGroup, (typeof NOW_ADMIN_GROUPS)[NowAdminGroup]]
          >).map(([key, group]) => {
            const groupHasAccessibleTables = NOW_TABLES.some(
              (table) => table.group === key && canAccessNowTable(access, table),
            );

            if (!groupHasAccessibleTables) {
              return null;
            }

            return (
              <Link
                key={key}
                href={`/admin/now/data?group=${key}`}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  activeGroup === key
                    ? 'bg-violet-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {group.labelAr}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTables.map((definition) => (
          <Link
            key={definition.table}
            href={`/admin/now/data/${definition.table}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-950">
                  {definition.labelAr}
                </p>
                <code className="mt-1 block text-xs font-bold text-violet-600">
                  now.{definition.table}
                </code>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                  definition.mutationMode === 'crud'
                    ? 'bg-emerald-100 text-emerald-700'
                    : definition.mutationMode === 'update-only'
                      ? 'bg-blue-100 text-blue-700'
                      : definition.mutationMode === 'workflow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {definition.mutationMode === 'crud'
                  ? 'CRUD'
                  : definition.mutationMode === 'update-only'
                    ? 'UPDATE'
                    : definition.mutationMode === 'workflow'
                      ? 'WORKFLOW'
                      : 'READ ONLY'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {definition.descriptionAr}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm font-black text-violet-700">
              فتح الجدول
              <ArrowLeft size={16} className="transition group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      {visibleTables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          لا توجد جداول في هذه المجموعة متاحة بصلاحياتك الحالية.
        </div>
      ) : null}
    </div>
  );
}
