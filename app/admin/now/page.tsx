import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { requireNowAdmin } from './lib/admin-data';
import { getNowSchemaCatalog } from './lib/table-data';
import {
  canAccessNowTable,
  NOW_ADMIN_GROUPS,
  NOW_TABLES,
  type NowAdminGroup,
} from './lib/table-registry';

export default async function NavientyNowAdminPage() {
  const [{ access }, schemaCatalog] = await Promise.all([
    requireNowAdmin(),
    getNowSchemaCatalog(),
  ]);
  const accessibleTables = NOW_TABLES.filter((table) => canAccessNowTable(access, table));
  const registeredNames = new Set(NOW_TABLES.map((table) => table.table));
  const unregisteredTables = schemaCatalog.filter(
    (table) => !registeredNames.has(table.table_name),
  );
  const groups = (Object.entries(NOW_ADMIN_GROUPS) as Array<
    [NowAdminGroup, (typeof NOW_ADMIN_GROUPS)[NowAdminGroup]]
  >)
    .map(([key, value]) => ({
      key,
      ...value,
      tables: accessibleTables.filter((table) => table.group === key),
    }))
    .filter((group) => group.tables.length > 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-violet-200">
              <Sparkles size={14} />
              Navienty Now Admin
            </div>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              مركز تحكم واحد لكل ما يظهر ويعمل داخل التطبيق
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              الكتالوج والمتاجر والأسعار، التغطية، البانرات والعروض، الدفع، الخدمات،
              الإشعارات، الامتثال والـsystem data — كلها موجودة تحت نفس مساحة الإدارة مع فصل
              الـCRUD عن الـworkflows الحساسة.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {access.permissions.view_orders ? (
                <Link
                  href="/admin/now/orders"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-500"
                >
                  <ClipboardList size={17} />
                  تشغيل الطلبات
                </Link>
              ) : null}
              <Link
                href="/admin/now/data"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15"
              >
                <Database size={17} />
                Database Manager
              </Link>
              {access.permissions.manage_orders || access.permissions.manage_settings ? (
                <Link
                  href="/admin/now/review"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 hover:bg-amber-400/15"
                >
                  <ShieldCheck size={17} />
                  مركز المراجعات
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Live database coverage
            </p>
            <p className="mt-2 text-5xl font-black text-white">
              {NOW_TABLES.length}/{schemaCatalog.length}
            </p>
            <p
              className={`mt-2 text-sm font-bold ${
                unregisteredTables.length === 0 ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {unregisteredTables.length === 0
                ? 'كل جداول schema now مسجلة في الـAdmin Registry'
                : `${unregisteredTables.length} جدول جديد يحتاج تصنيف`}
            </p>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
              المتاح بصلاحيتك الحالية: {accessibleTables.length} جدول
            </div>
          </div>
        </div>
      </section>

      {unregisteredTables.length > 0 && access.permissions.manage_settings ? (
        <Link
          href="/admin/now/data?group=system"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={21} />
          <div>
            <p className="font-black">Schema Coverage Guard يحتاج انتباهك</p>
            <p className="mt-1 text-sm leading-6">
              قاعدة البيانات فيها {unregisteredTables.length} جدول غير مسجل. الجداول مكتشفة
              تلقائيًا ومتاح عرضها Read-only لحد ما نحدد صلاحياتها وWorkflow التعديل الآمن.
            </p>
          </div>
        </Link>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">أقسام التحكم</h3>
            <p className="mt-1 text-sm text-slate-500">
              كل قسم يفتح الجداول والبيانات المرتبطة به مباشرة.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.key}
              href={`/admin/now/data?group=${group.key}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black">{group.labelAr}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{group.descriptionAr}</p>
                </div>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                  {group.tables.length}
                </span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-black text-violet-700">
                فتح القسم
                <ArrowLeft size={16} className="transition group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={21} />
          <div>
            <h3 className="font-black">قاعدة الأمان في لوحة Now</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Orders history، voucher redemptions، notification logs وباقي سجلات الـaudit لا يتم
              تعديلها Raw. العمليات التي لها RPC أو state transition تستخدم مسارها الآمن، بينما
              المحتوى والإعدادات فقط هي التي تستخدم CRUD المباشر بعد التحقق من صلاحيات الأدمن على
              السيرفر. وأي جدول جديد يظهر تلقائيًا Read-only بدل ما يختفي من الواجهة.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
