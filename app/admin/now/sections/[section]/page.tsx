import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  Bell,
  ClipboardList,
  Database,
  MapPinned,
  Megaphone,
  Settings,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { getNowSectionOverview } from '../../lib/section-data';
import {
  NOW_ADMIN_GROUPS,
  type NowAdminGroup,
  type NowTableDefinition,
} from '../../lib/table-registry';

const SECTION_META: Record<NowAdminGroup, { title: string; description: string; tasks: string[] }> = {
  orders: {
    title: 'الطلبات والتشغيل',
    description: 'كل ما يخص متابعة الطلبات من لحظة وصولها وحتى التسليم.',
    tasks: ['متابعة الطلبات وحالتها الحالية', 'الرجوع لتفاصيل المنتجات والأسعار', 'مراجعة سجل الحالات والتقييمات'],
  },
  catalog: {
    title: 'المتاجر والمنتجات',
    description: 'إدارة كل ما يراه العميل داخل المتاجر والكتالوج.',
    tasks: ['إضافة وتعديل المتاجر وبيانات التواصل', 'ضبط مواعيد العمل والتغطية', 'إدارة الأقسام والمنتجات والأسعار والصور والاختيارات'],
  },
  marketing: {
    title: 'العروض والكوبونات',
    description: 'تحكم في المحتوى الترويجي الذي يظهر للعميل والخصومات المتاحة.',
    tasks: ['إنشاء وجدولة البانرات', 'ربط البانرات بالمنتجات والمناطق', 'إنشاء وإيقاف أكواد الخصم ومتابعة استخدامها'],
  },
  geography: {
    title: 'المدن ومناطق التغطية',
    description: 'حدد أين يعمل Navienty Now وما هي قواعد التوصيل في كل منطقة.',
    tasks: ['إدارة المدن والمناطق', 'ضبط رسوم التوصيل والحد الأدنى', 'ضبط الوقت المتوقع وحدود التغطية'],
  },
  payments: {
    title: 'الدفع والتحصيل',
    description: 'إدارة طرق التحويل والحسابات والرسوم ومراجعات الدفع.',
    tasks: ['تشغيل وإيقاف طرق الدفع', 'تعديل حسابات InstaPay والمحافظ', 'ضبط رسوم الدفع ومراجعة الإثباتات'],
  },
  services: {
    title: 'الخدمات والحجوزات',
    description: 'إدارة الخدمات القابلة للحجز ومتابعة تنفيذ كل حجز.',
    tasks: ['إنشاء وتعديل باقات الخدمات', 'متابعة الحجوزات النشطة', 'مراجعة إثباتات دفع الخدمات'],
  },
  compliance: {
    title: 'التحقق والامتثال',
    description: 'المهام الحساسة التي تحتاج قرارًا واضحًا ومسارًا آمنًا.',
    tasks: ['مراجعة الروشتات', 'تأكيد التحقق من العمر', 'معالجة طلبات حذف الحساب'],
  },
  notifications: {
    title: 'الإشعارات',
    description: 'راقب وصول إشعارات التطبيق والأجهزة المرتبطة وحالات الفشل.',
    tasks: ['متابعة الأجهزة المسجلة', 'متابعة طابور الإرسال', 'تشخيص الإشعارات التي فشلت'],
  },
  system: {
    title: 'إدارة النظام',
    description: 'إعدادات وصلاحيات ومعلومات تشخيصية لا يحتاجها التشغيل اليومي عادةً.',
    tasks: ['إدارة صلاحيات فريق Now', 'متابعة أخطاء تطبيق الموبايل', 'مراجعة سجلات النظام'],
  },
};

const ICONS: Record<NowAdminGroup, typeof Store> = {
  orders: ClipboardList,
  catalog: Store,
  marketing: Megaphone,
  geography: MapPinned,
  payments: Banknote,
  services: Wrench,
  compliance: ShieldCheck,
  notifications: Bell,
  system: Settings,
};

function getTableHref(definition: NowTableDefinition) {
  if (definition.table === 'app_settings') return '/admin/now/settings';
  if (definition.table === 'admin_members') return '/admin/now/team';
  if (definition.table === 'orders') return '/admin/now/orders';
  if (definition.mutationMode === 'workflow') return '/admin/now/review';
  return `/admin/now/data/${definition.table}`;
}

function capability(definition: NowTableDefinition) {
  if (definition.table === 'app_settings') return 'تعديل إعدادات التطبيق';
  if (definition.table === 'admin_members') return 'إدارة فريق العمل';
  if (definition.table === 'orders') return 'متابعة وتشغيل';
  if (definition.mutationMode === 'crud') return 'إضافة وتعديل';
  if (definition.mutationMode === 'update-only') return 'تعديل';
  if (definition.mutationMode === 'workflow') return 'إجراء آمن';
  return 'عرض ومراجعة';
}

export default async function NowSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in NOW_ADMIN_GROUPS)) notFound();

  const group = section as NowAdminGroup;
  const meta = SECTION_META[group];
  const Icon = ICONS[group];
  const { tables, totalRecords } = await getNowSectionOverview(group);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="إدارة Navienty Now"
        title={meta.title}
        description={meta.description}
        icon={<Icon size={16} />}
        actions={group === 'orders' ? <Link href="/admin/now/orders" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white">فتح الطلبات</Link> : undefined}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {meta.tasks.map((task, index) => (
          <div key={task} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">{index + 1}</span>
              <p className="text-sm font-bold leading-6 text-slate-700">{task}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">اختار اللي عايز تديره</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{tables.length} أقسام فرعية · {totalRecords.toLocaleString('ar-EG')} سجل حالي</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map(({ definition, count, error }) => (
            <Link key={definition.table} href={getTableHref(definition)} className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black text-slate-950">{definition.labelAr}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{error ? '—' : count.toLocaleString('ar-EG')}</span>
              </div>
              <p className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-500">{definition.descriptionAr}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-black text-emerald-700">{capability(definition)}</span>
                <span className="flex items-center gap-1 text-xs font-black text-violet-700">فتح <ArrowLeft size={14} className="transition group-hover:-translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-500">أدوات متقدمة للمشرفين</summary>
        <div className="border-t border-slate-100 p-4">
          <Link href={`/admin/now/data?group=${group}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
            <Database size={14} /> عرض بيانات القسم بشكل متقدم
          </Link>
        </div>
      </details>
    </div>
  );
}
