import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import RecordForm from '../../components/record-form';
import { EmptyState, Notice, PageHeader } from '../../components/ui-kit';
import { deleteNowTableRow } from '../actions';
import {
  getAdminTableRows,
  getNowRelationOptions,
  getNowTableColumns,
  getRowPrimaryKey,
  getRowTitle,
  resolveNowTableAccess,
} from '../../lib/table-data';
import { canMutateNowTable } from '../../lib/table-registry';
import { formatEmployeeValue, getFieldLabel, isSystemManagedColumn } from '../../lib/ui-config';

function buildHref(table: string, page: number, search?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (search) params.set('q', search);
  const query = params.toString();
  return query ? `/admin/now/data/${table}?${query}` : `/admin/now/data/${table}`;
}

function accessLabel(mode: string) {
  if (mode === 'crud') return 'يمكنك الإضافة والتعديل';
  if (mode === 'update-only') return 'يمكنك تعديل الإعدادات';
  if (mode === 'workflow') return 'الإجراءات تتم من شاشة التشغيل الآمنة';
  return 'للمشاهدة والمراجعة فقط';
}

export default async function NavientyNowTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ page?: string; q?: string; success?: string; error?: string }>;
}) {
  const { table } = await params;
  const resolved = await resolveNowTableAccess(table);
  if (!resolved) notFound();

  const query = await searchParams;
  const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
  const search = query.q?.trim() || '';
  const [result, columns, relationOptions] = await Promise.all([
    getAdminTableRows({ tableName: table, page, pageSize: 30, search }),
    getNowTableColumns(table),
    getNowRelationOptions(table),
  ]);
  const definition = result.definition;
  const canMutate = result.isRegistered && canMutateNowTable(resolved.access, definition);
  const canCreate = canMutate && definition.mutationMode === 'crud';
  const workflowHref = definition.table === 'orders' ? '/admin/now/orders' : '/admin/now/review';
  const summaryColumns = columns
    .filter((column) => !isSystemManagedColumn(column.column_name) && !definition.primaryKey.includes(column.column_name) && !['jsonb', 'json'].includes(column.data_type))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="إدارة البيانات"
        title={definition.labelAr}
        description={definition.descriptionAr}
        actions={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{result.pagination.total.toLocaleString('ar-EG')} سجل</span>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/now/sections/${definition.group}`} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-violet-700">
          <ArrowRight size={15} /> الرجوع للقسم
        </Link>
        <span className="text-xs font-black text-emerald-700">{accessLabel(definition.mutationMode)}</span>
      </div>

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      {!result.isRegistered ? (
        <Notice tone="warning" title="مصدر بيانات جديد">
          تم اكتشافه تلقائيًا، ولذلك هو متاح للمشاهدة فقط لحين تحديد طريقة إدارته الآمنة.
        </Notice>
      ) : null}

      {definition.mutationMode === 'workflow' ? (
        <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <h2 className="font-black text-violet-950">الإجراء يتم من شاشة التشغيل</h2>
          <p className="mt-1 text-xs font-semibold leading-6 text-violet-800">لحماية سجل الطلبات والدفعات، التغييرات الحساسة تتم بخطوات واضحة بدل تعديل البيانات مباشرة.</p>
          <Link href={workflowHref} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">فتح شاشة التشغيل <ArrowLeft size={14} /></Link>
        </section>
      ) : null}

      {canCreate ? (
        <details className="group rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
            <span className="flex items-center gap-2 font-black text-emerald-800"><Plus size={18} /> إضافة جديد</span>
            <ChevronDown size={17} className="text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-emerald-100 p-5">
            <RecordForm definition={definition} columns={columns} relationOptions={relationOptions} mode="create" />
          </div>
        </details>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={search} disabled={!definition.searchColumn} placeholder={definition.searchColumn ? `ابحث في ${getFieldLabel(definition.searchColumn)}` : 'البحث غير متاح هنا'} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white disabled:text-slate-400" />
          </label>
          <button type="submit" disabled={!definition.searchColumn} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-black text-white disabled:opacity-40">بحث</button>
          {search ? <Link href={`/admin/now/data/${definition.table}`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-black text-slate-600">مسح البحث</Link> : null}
        </form>
      </section>

      <section className="space-y-3">
        {result.rows.map((row, index) => {
          const primaryKey = getRowPrimaryKey(definition, row);
          const primaryKeyJson = JSON.stringify(primaryKey);
          const rowHref = definition.table === 'orders' && typeof row.id === 'string' ? `/admin/now/orders/${row.id}` : null;
          return (
            <details key={`${primaryKeyJson}-${index}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none p-5 transition hover:bg-slate-50/70">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-950">{getRowTitle(definition, row)}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                      {summaryColumns.map((column) => (
                        <div key={column.column_name} className="text-xs">
                          <span className="font-bold text-slate-400">{getFieldLabel(column.column_name)}: </span>
                          <span className="font-black text-slate-700">{formatEmployeeValue(row[column.column_name])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-black text-violet-700">فتح التفاصيل <ChevronDown size={15} className="transition group-open:rotate-180" /></span>
                </div>
              </summary>

              <div className="border-t border-slate-100 p-5">
                {rowHref ? <Link href={rowHref} className="mb-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white"><ExternalLink size={14} /> فتح الطلب</Link> : null}

                {canMutate ? (
                  <RecordForm definition={definition} columns={columns} relationOptions={relationOptions} row={row} primaryKeyJson={primaryKeyJson} mode="update" />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {columns.filter((column) => !isSystemManagedColumn(column.column_name)).map((column) => (
                      <div key={column.column_name} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black text-slate-400">{getFieldLabel(column.column_name)}</p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-700">{formatEmployeeValue(row[column.column_name])}</p>
                      </div>
                    ))}
                  </div>
                )}

                <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-500">بيانات تقنية متقدمة</summary>
                  <pre dir="ltr" className="max-h-80 overflow-auto border-t border-slate-200 p-4 text-left text-[11px] leading-5 text-slate-600">{JSON.stringify(row, null, 2)}</pre>
                </details>

                {canMutate && definition.mutationMode === 'crud' ? (
                  <details className="mt-3 rounded-xl border border-rose-100 bg-rose-50/40">
                    <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-rose-700">إجراءات إضافية</summary>
                    <form action={deleteNowTableRow} className="border-t border-rose-100 p-4">
                      <input type="hidden" name="table" value={definition.table} />
                      <input type="hidden" name="primary_key" value={primaryKeyJson} />
                      <p className="mb-3 text-xs font-semibold leading-6 text-rose-700">استخدم الحذف فقط إذا كان السجل أُضيف بالخطأ. لو فيه خيار تعطيل، التعطيل أكثر أمانًا.</p>
                      <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"><Trash2 size={14} /> حذف نهائي</button>
                    </form>
                  </details>
                ) : null}
              </div>
            </details>
          );
        })}
      </section>

      {result.rows.length === 0 ? <EmptyState title="لا توجد بيانات مطابقة" description={search ? 'جرّب مسح البحث أو استخدام كلمة مختلفة.' : 'لا توجد سجلات في هذا القسم حتى الآن.'} /> : null}

      {result.pagination.pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {result.pagination.page > 1 ? <Link href={buildHref(definition.table, result.pagination.page - 1, search)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"><ArrowRight size={14} /> السابق</Link> : <span />}
          <span className="text-xs font-black text-slate-500">صفحة {result.pagination.page.toLocaleString('ar-EG')} من {result.pagination.pageCount.toLocaleString('ar-EG')}</span>
          {result.pagination.page < result.pagination.pageCount ? <Link href={buildHref(definition.table, result.pagination.page + 1, search)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">التالي <ArrowLeft size={14} /></Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
