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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Navienty Now"
        title="لوحة تشغيل موحّدة"
        description="كل مهام التشغيل اليومية في مكان واحد، بنفس هوية وتجربة لوحة Navienty الرئيسية."
        icon={<Boxes size={16} />}
        actions={
          <>
            {access.permissions.view_orders ? (
              <Link
                href="/admin/now/orders"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all hover:-translate-y-[1px] hover:bg-blue-700"
              >
                <ClipboardList size={16} /> فتح الطلبات
              </Link>
            ) : null}
            {data.pendingReviews > 0 ? (
              <Link
                href="/admin/now/review"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
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
        <section className="rounded-[32px] border border-black/[0.05] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Live Operations</div>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#111827]">محتاج متابعة دلوقتي</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">اختصارات مباشرة للطلبات والحالات اللي محتاجة إجراء.</p>
            </div>
            <Link href="/admin/now/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
              عرض كل الطلبات <ArrowLeft size={14} />
            </Link>
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">استقبال الطلبات</p>
            <p className={`mt-3 text-base font-semibold ${settings.orders_enabled ? 'text-emerald-700' : 'text-rose-700'}`}>
              {settings.orders_enabled ? 'يعمل بشكل طبيعي' : 'متوقف'}
            </p>
          </div>
          <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">عرض المنتجات</p>
            <p className={`mt-3 text-base font-semibold ${settings.catalog_enabled ? 'text-emerald-700' : 'text-rose-700'}`}>
              {settings.catalog_enabled ? 'الكتالوج يعمل' : 'الكتالوج متوقف'}
            </p>
          </div>
          <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">المتاجر المسجلة</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">{counts.stores ?? '—'}</p>
          </div>
          <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">التحقق من التغطية</p>
            <p className={`mt-3 text-base font-semibold ${settings.location_geofencing_enabled ? 'text-emerald-700' : 'text-amber-700'}`}>
              {settings.location_geofencing_enabled ? 'مفعّل' : 'غير مفعّل'}
            </p>
          </div>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-black/[0.05] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] md:p-6">
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Workspace</div>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#111827]">إدارة التطبيق</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">اختار المهمة مباشرة، وكل قسم بيستخدم نفس نمط الواجهة والـcontrols.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.filter((module) => module.visible).map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-[26px] border border-black/[0.06] bg-[#fcfcfd] p-5 shadow-[0_6px_22px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-blue-100 bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-[#111827]">{module.title}</h3>
                      {module.note ? (
                        <span className="rounded-full bg-[#f3f5f8] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                          {module.note}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-gray-500">{module.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
                      فتح القسم <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
                    </div>
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
