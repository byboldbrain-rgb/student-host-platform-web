import Link from 'next/link';
import { ArrowLeft, Database, ShieldCheck } from 'lucide-react';

import { Notice, PageHeader } from '../components/ui-kit';
import { requireNowAdmin } from '../lib/admin-data';
import { getNowSchemaCatalog } from '../lib/table-data';
import {
  canAccessNowTable,
  NOW_ADMIN_GROUPS,
  NOW_TABLES,
  type NowAdminGroup,
} from '../lib/table-registry';

function isGroup(value: string | undefined): value is NowAdminGroup {
  return Boolean(value && Object.prototype.hasOwnProperty.call(NOW_ADMIN_GROUPS, value));
}

function capability(mode: string) {
  if (mode === 'crud') return 'إضافة وتعديل';
  if (mode === 'update-only') return 'تعديل فقط';
  if (mode === 'workflow') return 'من شاشة التشغيل';
  return 'مشاهدة فقط';
}

export default async function NavientyNowDataIndexPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const [{ access }, schemaCatalog, params] = await Promise.all([requireNowAdmin(), getNowSchemaCatalog(), searchParams]);
  const activeGroup = isGroup(params.group) ? params.group : null;
  const visibleTables = NOW_TABLES.filter((definition) => canAccessNowTable(access, definition) && (!activeGroup || definition.group === activeGroup));
  const registeredNames = new Set(NOW_TABLES.map((table) => table.table));
  const unregisteredTables = schemaCatalog.filter((table) => !registeredNames.has(table.table_name));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="للمشرفين"
        title="أدوات البيانات المتقدمة"
        description="الموظف في التشغيل اليومي يُفضّل يستخدم الأقسام الرئيسية. المنطقة دي موجودة للوصول لكل مصادر البيانات والتشخيص عند الحاجة."
        icon={<Database size={16} />}
      />

      <Notice tone="info" title="مش محتاج تعرف اسم جدول أو تكتب JSON">
        افتح أي مصدر من هنا وستظهر لك الحقول بأسماء مفهومة ونماذج إدخال منظمة. التفاصيل التقنية موجودة فقط داخل الخيارات المتقدمة.
      </Notice>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/now/data" className={`rounded-xl px-3 py-2 text-xs font-black ${!activeGroup ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600'}`}>الكل</Link>
          {(Object.entries(NOW_ADMIN_GROUPS) as Array<[NowAdminGroup, (typeof NOW_ADMIN_GROUPS)[NowAdminGroup]]>).map(([key, group]) => {
            const visible = NOW_TABLES.some((table) => table.group === key && canAccessNowTable(access, table));
            if (!visible) return null;
            return <Link key={key} href={`/admin/now/data?group=${key}`} className={`rounded-xl px-3 py-2 text-xs font-black ${activeGroup === key ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{group.labelAr}</Link>;
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleTables.map((definition) => (
          <Link key={definition.table} href={`/admin/now/data/${definition.table}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{definition.labelAr}</h3>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{capability(definition.mutationMode)}</p>
              </div>
              <ShieldCheck size={17} className="text-slate-300" />
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{definition.descriptionAr}</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-black text-violet-700">فتح <ArrowLeft size={14} className="transition group-hover:-translate-x-1" /></div>
          </Link>
        ))}
      </section>

      {unregisteredTables.length > 0 && access.permissions.manage_settings ? (
        <details className="rounded-2xl border border-amber-200 bg-amber-50">
          <summary className="cursor-pointer list-none p-4 text-sm font-black text-amber-900">تم اكتشاف {unregisteredTables.length} مصدر بيانات جديد</summary>
          <div className="border-t border-amber-200 p-4 text-xs font-semibold leading-6 text-amber-800">
            تظهر للقراءة فقط حتى يتم تحديد طريقة إدارتها الآمنة.
            <div className="mt-3 flex flex-wrap gap-2">
              {unregisteredTables.map((table) => <Link key={table.table_name} href={`/admin/now/data/${table.table_name}`} className="rounded-lg bg-white px-3 py-2 font-mono">{table.table_name}</Link>)}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
