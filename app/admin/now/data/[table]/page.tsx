import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Braces,
  ExternalLink,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';

import {
  createNowTableRow,
  deleteNowTableRow,
  updateNowTableRow,
} from '../actions';
import {
  getAdminTableRows,
  getCreateTemplate,
  getRowPrimaryKey,
  getRowTitle,
  resolveNowTableAccess,
} from '../../lib/table-data';
import { canMutateNowTable } from '../../lib/table-registry';

function renderValue(value: unknown) {
  if (value === null) {
    return 'NULL';
  }

  if (value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function buildHref(table: string, page: number, search?: string) {
  const params = new URLSearchParams();
  params.set('page', String(page));

  if (search) {
    params.set('q', search);
  }

  return `/admin/now/data/${table}?${params.toString()}`;
}

export default async function NavientyNowTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const { table } = await params;
  const resolved = await resolveNowTableAccess(table);

  if (!resolved) {
    notFound();
  }

  const query = await searchParams;
  const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
  const search = query.q?.trim() || '';
  const result = await getAdminTableRows({
    tableName: table,
    page,
    pageSize: 50,
    search,
  });
  const definition = result.definition;
  const canMutate =
    result.isRegistered && canMutateNowTable(resolved.access, definition);
  const canCreate = canMutate && definition.mutationMode === 'crud';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/admin/now/data?group=${definition.group}`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-violet-700 hover:text-violet-900"
            >
              <ArrowRight size={16} />
              الرجوع إلى المجموعة
            </Link>

            <h2 className="text-2xl font-black sm:text-3xl">{definition.labelAr}</h2>
            <code className="mt-2 block text-xs font-bold text-violet-600">
              now.{definition.table}
            </code>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {definition.descriptionAr}
            </p>
          </div>

          <div className="text-left">
            <p className="text-2xl font-black text-slate-950">{result.pagination.total}</p>
            <p className="text-xs font-bold text-slate-500">إجمالي السجلات</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            PK: {definition.primaryKey.join(' + ')}
          </span>
          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">
            Permission: {definition.permission}
          </span>
          <span
            className={`rounded-full px-3 py-1.5 ${
              canMutate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {definition.mutationMode.toUpperCase()}
          </span>
        </div>
      </section>

      {!result.isRegistered ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-black">Schema Coverage Guard اكتشف الجدول تلقائيًا.</p>
            <p>
              الجدول ظاهر بالكامل للقراءة، لكن التعديل مقفول لحد ما يتم تسجيله في Admin Registry
              وتحديد permission وworkflow آمنين. كده أي Table جديد مش هيختفي من الـAdmin.
            </p>
          </div>
        </div>
      ) : null}

      {query.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {query.success}
        </div>
      ) : null}

      {query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
          {query.error}
        </div>
      ) : null}

      {definition.mutationMode === 'workflow' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          هذا جدول Workflow، لذلك لا يتم تعديله مباشرة بالـservice role حتى لا يتم تجاوز قواعد
          الـstate machine. استخدم مركز المراجعات أو واجهة الطلبات لتنفيذ العمليات الآمنة.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/now/review"
              className="rounded-xl bg-amber-900 px-4 py-2 font-black text-white"
            >
              مركز المراجعات
            </Link>
            {definition.table === 'orders' ? (
              <Link
                href="/admin/now/orders"
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 font-black"
              >
                شاشة الطلبات
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {canCreate ? (
        <details className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-5 font-black text-emerald-800">
            <Plus size={18} />
            إضافة سجل جديد
          </summary>
          <form action={createNowTableRow} className="border-t border-emerald-100 p-5">
            <input type="hidden" name="table" value={definition.table} />
            <p className="mb-3 text-xs leading-5 text-slate-500">
              أدخل JSON Object. الحقول المطلوبة الأساسية موضوعة في القالب، وباقي الحقول يمكن
              إضافتها كما هي موجودة في الـDatabase.
            </p>
            <textarea
              name="payload"
              rows={Math.max(10, (definition.requiredColumns?.length ?? 0) + 4)}
              defaultValue={JSON.stringify(getCreateTemplate(definition), null, 2)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300 outline-none focus:border-emerald-500"
              dir="ltr"
              spellCheck={false}
              required
            />
            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700"
            >
              <Plus size={17} />
              إنشاء السجل
            </button>
          </form>
        </details>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={search}
              disabled={!definition.searchColumn}
              placeholder={
                definition.searchColumn
                  ? `بحث في ${definition.searchColumn}`
                  : 'البحث غير متاح لهذا الجدول'
              }
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-violet-400 disabled:bg-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={!definition.searchColumn}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            بحث
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {result.rows.map((row, index) => {
          const primaryKey = getRowPrimaryKey(definition, row);
          const primaryKeyJson = JSON.stringify(primaryKey);
          const rowJson = JSON.stringify(row, null, 2);
          const rowHref =
            definition.table === 'orders' && typeof row.id === 'string'
              ? `/admin/now/orders/${row.id}`
              : null;

          return (
            <details
              key={`${primaryKeyJson}-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <summary className="cursor-pointer list-none p-5 hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{getRowTitle(definition, row)}</p>
                    <code className="mt-1 block text-[11px] text-slate-500" dir="ltr">
                      {primaryKeyJson}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Braces size={15} />
                    عرض كل الأعمدة
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-100 p-5">
                {rowHref ? (
                  <Link
                    href={rowHref}
                    className="mb-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white"
                  >
                    <ExternalLink size={16} />
                    فتح واجهة الطلب التشغيلية
                  </Link>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-2">
                  {Object.entries(row).map(([column, value]) => (
                    <div
                      key={column}
                      className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-[11px] font-black text-violet-700" dir="ltr">
                        {column}
                      </p>
                      <pre
                        className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs leading-5 text-slate-700"
                        dir="auto"
                      >
                        {renderValue(value)}
                      </pre>
                    </div>
                  ))}
                </div>

                {canMutate ? (
                  <details className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/50">
                    <summary className="cursor-pointer list-none p-4 font-black text-blue-800">
                      تعديل السجل كـ JSON
                    </summary>
                    <form action={updateNowTableRow} className="border-t border-blue-100 p-4">
                      <input type="hidden" name="table" value={definition.table} />
                      <input type="hidden" name="primary_key" value={primaryKeyJson} />
                      <textarea
                        name="payload"
                        rows={18}
                        defaultValue={rowJson}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-300 outline-none focus:border-blue-500"
                        dir="ltr"
                        spellCheck={false}
                        required
                      />
                      <button
                        type="submit"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700"
                      >
                        <Save size={17} />
                        حفظ التعديلات
                      </button>
                    </form>
                  </details>
                ) : null}

                {canMutate && definition.mutationMode === 'crud' ? (
                  <details className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/60">
                    <summary className="cursor-pointer list-none p-4 text-sm font-black text-rose-800">
                      منطقة الخطر — حذف نهائي
                    </summary>
                    <form action={deleteNowTableRow} className="border-t border-rose-100 p-4">
                      <input type="hidden" name="table" value={definition.table} />
                      <input type="hidden" name="primary_key" value={primaryKeyJson} />
                      <p className="mb-3 text-xs leading-5 text-rose-700">
                        الحذف سيخضع لعلاقات Foreign Key وقيود قاعدة البيانات. لا تستخدمه بدل
                        تعطيل is_active عندما يكون التعطيل كافيًا.
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white hover:bg-rose-700"
                      >
                        <Trash2 size={17} />
                        حذف السجل
                      </button>
                    </form>
                  </details>
                ) : null}
              </div>
            </details>
          );
        })}
      </section>

      {result.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          لا توجد سجلات مطابقة.
        </div>
      ) : null}

      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {result.pagination.page > 1 ? (
          <Link
            href={buildHref(definition.table, result.pagination.page - 1, search)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50"
          >
            <ArrowRight size={16} />
            السابق
          </Link>
        ) : (
          <span />
        )}

        <span className="text-xs font-bold text-slate-500">
          صفحة {result.pagination.page} من {result.pagination.pageCount}
        </span>

        {result.pagination.page < result.pagination.pageCount ? (
          <Link
            href={buildHref(definition.table, result.pagination.page + 1, search)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50"
          >
            التالي
            <ArrowLeft size={16} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
