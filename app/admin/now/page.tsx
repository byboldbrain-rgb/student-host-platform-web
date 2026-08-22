import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  Bell,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  MapPinned,
  Megaphone,
  PackageSearch,
  Settings,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react';

import { MetricCard, Notice, PageHeader } from './components/ui-kit';
import { getNowEmployeeDashboardData } from './lib/dashboard-data';

type Module = {
  title: string;
  description: string;
  href: string;
  icon: typeof Store;
  visible: boolean;
  note?: string;
};

export default async function NavientyNowAdminPage() {
  const data = await getNowEmployeeDashboardData();
  const { access, orders, settings, counts } = data;
  const summary = orders?.summary;

  const modules: Module[] = [
    {
      title: 'الطلبات',
      description: 'تابع الطلب من وصوله لحد التسليم، وحدّث حالته خطوة بخطوة.',
      href: '/admin/now/orders',
      icon: ClipboardList,
      visible: access.permissions.view_orders,
      note: summary ? `${summary.total} طلب مسجل` : undefined,
    },
    {
      title: 'المتاجر والمنتجات',
      description: 'أضف المتاجر، عدّل المواعيد، الأقسام، المنتجات والأسعار والتوفر.',
      href: '/admin/now/sections/catalog',
      icon: Store,
      visible: access.permissions.manage_catalog,
      note: counts.products !== null ? `${counts.products} منتج` : undefined,
    },
    {
      title: 'العروض والكوبونات',
      description: 'تحكم في البانرات والعروض وأكواد الخصم ومواعيد ظهورها.',
      href: '/admin/now/sections/marketing',
      icon: Megaphone,
      visible: access.permissions.manage_catalog,
      note: counts.vouchers !== null ? `${counts.vouchers} كوبون` : undefined,
    },
    {
      title: 'مناطق التغطية',
      description: 'حدد المدن والمناطق ورسوم التوصيل والحد الأدنى ووقت الوصول.',
      href: '/admin/now/sections/geography',
      icon: MapPinned,
      visible: access.permissions.manage_settings,
    },
    {
      title: 'الدفع والتحصيل',
      description: 'طرق الدفع، حسابات التحويل، الرسوم وإثباتات الدفع.',
      href: '/admin/now/sections/payments',
      icon: Banknote,
      visible: access.permissions.manage_finance,
    },
    {
      title: 'الخدمات والحجوزات',
      description: 'إدارة باقات الخدمات ومتابعة الحجوزات حتى اكتمالها.',
      href: '/admin/now/sections/services',
      icon: Wrench,
      visible: access.permissions.manage_catalog || access.permissions.manage_orders,
      note: counts.serviceBookings !== null ? `${counts.serviceBookings} حجز` : undefined,
    },
    {
      title: 'التحقق والامتثال',
      description: 'الروشتات، التحقق من العمر، وإجراءات حذف الحساب.',
      href: '/admin/now/sections/compliance',
      icon: ShieldCheck,
      visible: access.permissions.manage_orders || access.permissions.manage_settings,
    },
    {
      title: 'الإشعارات',
      description: 'تابع أجهزة العملاء وحالة إرسال Push Notifications والأخطاء.',
      href: '/admin/now/sections/notifications',
      icon: Bell,
      visible: access.permissions.manage_settings,
    },
    {
      title: 'إعدادات التطبيق',
      description: 'تشغيل وإيقاف الطلبات، الصيانة، الدعم، التغطية وبوابات التحقق.',
      href: '/admin/now/settings',
      icon: Settings,
      visible: access.permissions.manage_settings,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="مركز تشغيل Navienty Now"
        title="كل اللي محتاجه لتشغيل التطبيق في مكان واحد"
        description="ابدأ من المهام المعلقة، وبعدها ادخل على القسم اللي محتاج تعدله. الواجهة مصممة للتشغيل اليومي بدون التعامل مع قاعدة البيانات أو أكواد داخلية."
        icon={<Boxes size={16} />}
        actions={
          <>
            {access.permissions.view_orders ? (
              <Link href="/admin/now/orders" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
                <ClipboardList size={16} /> فتح الطلبات
              </Link>
            ) : null}
            {data.pendingReviews > 0 ? (
              <Link href="/admin/now/review" className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-900 hover:bg-amber-100">
                <ClipboardCheck size={16} /> {data.pendingReviews} مراجعة معلقة
              </Link>
            ) : null}
          </>
        }
      />

      {settings?.maintenance_mode ? (
        <Notice tone="warning" title="وضع الصيانة مفعّل حاليًا">
          تجربة العميل قد تكون متوقفة أو محدودة. راجع إعدادات التطبيق قبل استمرار التشغيل.
        </Notice>
      ) : null}

      {summary ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">محتاج متابعة دلوقتي</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">الأرقام دي توصلك مباشرة للطلبات اللي محتاجة إجراء.</p>
            </div>
            <Link href="/admin/now/orders" className="text-xs font-black text-violet-700 hover:text-violet-900">عرض كل الطلبات</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="في انتظار واتساب" value={summary.awaiting_whatsapp_send} href="/admin/now/orders?status=awaiting_whatsapp_send" tone="amber" icon={<ClipboardList size={17} />} />
            <MetricCard label="في انتظار التأكيد" value={summary.waiting_confirmation} href="/admin/now/orders?status=waiting_confirmation" tone="violet" icon={<ClipboardCheck size={17} />} />
            <MetricCard label="جاري التجهيز" value={summary.preparing} href="/admin/now/orders?status=preparing" tone="sky" icon={<PackageSearch size={17} />} />
            <MetricCard label="خرج للتوصيل" value={summary.out_for_delivery} href="/admin/now/orders?status=out_for_delivery" tone="emerald" icon={<ArrowLeft size={17} />} />
            <MetricCard label="مراجعات معلقة" value={data.pendingReviews} href="/admin/now/review" tone={data.pendingReviews > 0 ? 'amber' : 'slate'} icon={<ShieldCheck size={17} />} />
          </div>
        </section>
      ) : null}

      {settings ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-500">استقبال الطلبات</p>
            <p className={`mt-2 text-sm font-black ${settings.orders_enabled ? 'text-emerald-700' : 'text-rose-700'}`}>{settings.orders_enabled ? 'يعمل بشكل طبيعي' : 'متوقف'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-500">عرض المنتجات</p>
            <p className={`mt-2 text-sm font-black ${settings.catalog_enabled ? 'text-emerald-700' : 'text-rose-700'}`}>{settings.catalog_enabled ? 'الكتالوج يعمل' : 'الكتالوج متوقف'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-500">المتاجر المسجلة</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{counts.stores ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-500">التحقق من التغطية</p>
            <p className={`mt-2 text-sm font-black ${settings.location_geofencing_enabled ? 'text-emerald-700' : 'text-amber-700'}`}>{settings.location_geofencing_enabled ? 'مفعّل' : 'غير مفعّل'}</p>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">إدارة التطبيق</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">اختار المهمة اللي عايز تعملها بدل ما تدور على اسم جدول أو حقل.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.filter((module) => module.visible).map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black text-slate-950">{module.title}</h3>
                      {module.note ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{module.note}</span> : null}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{module.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-black text-violet-700">فتح القسم <ArrowLeft size={14} className="transition group-hover:-translate-x-1" /></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
