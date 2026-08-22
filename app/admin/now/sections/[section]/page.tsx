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

import { getNowSectionOverview } from '../../lib/section-data';
import {
  NOW_ADMIN_GROUPS,
  type NowAdminGroup,
  type NowAdminMutationMode,
  type NowTableDefinition,
} from '../../lib/table-registry';

const SECTION_META: Record<
  NowAdminGroup,
  {
    eyebrow: string;
    impact: string[];
  }
> = {
  orders: {
    eyebrow: 'Order Operations',
    impact: [
      'متابعة دورة الطلب من الإنشاء حتى التسليم أو الإلغاء.',
      'عرض عناصر كل طلب والأسعار والـsnapshots التي شاهدها العميل وقت الشراء.',
      'مراجعة سجل تغيّر الحالات والتقييمات بدون العبث بسجلات الـaudit.',
    ],
  },
  catalog: {
    eyebrow: 'Commerce & Catalog',
    impact: [
      'إنشاء وتعديل المتاجر وفئاتها وحالة الفتح والإغلاق اليدوي ومواعيد العمل.',
      'إدارة الأقسام والأقسام الفرعية والمنتجات والأسعار والتوفر والصور والـvariants.',
      'التحكم بقيود الصيدلية مثل requires_prescription وis_age_restricted.',
      'تحديد رسوم التوصيل والحد الأدنى والـETA لكل متجر داخل كل منطقة خدمة.',
    ],
  },
  marketing: {
    eyebrow: 'Growth & Promotions',
    impact: [
      'إدارة Home Banners ومواعيد عرضها والجمهور والـplacement والـCTA والـtheme/content.',
      'ربط البانرات بمنتجات أو مناطق خدمة أو باقات خدمات.',
      'إنشاء الكوبونات ونوع الخصم ونطاقه وفترة الصلاحية وحدود الاستخدام.',
      'عرض سجل استخدام الكوبونات كـaudit مالي غير قابل للتعديل المباشر.',
    ],
  },
  geography: {
    eyebrow: 'Delivery Geography',
    impact: [
      'إدارة المدن ومناطق خدمة Navienty Now.',
      'تعديل boundary_points المستخدمة في geofencing.',
      'ضبط رسوم التوصيل والحد الأدنى ووقت التوصيل الافتراضي لكل منطقة.',
    ],
  },
  payments: {
    eyebrow: 'Payments & Finance',
    impact: [
      'تشغيل وإيقاف طرق الدفع وترتيبها وتعليمات العميل.',
      'إدارة حسابات InstaPay والمحافظ وبيانات الحساب والـQR.',
      'ضبط رسوم الدفع: ثابتة أو نسبة وحدودها وهل يتحملها العميل.',
      'مراجعة إثباتات الدفع عبر الـworkflow الآمن بدل تعديل الحالة Raw.',
    ],
  },
  services: {
    eyebrow: 'Service Operations',
    impact: [
      'إنشاء وتعديل باقات الخدمات وأسعارها وصورها وبياناتها.',
      'متابعة حجوزات الخدمات عبر state machine من WhatsApp حتى التسليم.',
      'مراجعة إثباتات دفع حجوزات الخدمات وربطها بطرق الدفع.',
    ],
  },
  compliance: {
    eyebrow: 'Trust & Compliance',
    impact: [
      'مراجعة الروشتات الطبية والمرفقات الخاصة بها.',
      'إدارة التحقق العمري للطلبات المقيدة.',
      'تشغيل طلبات حذف الحساب ومراحل preflight والمعالجة والإكمال.',
    ],
  },
  notifications: {
    eyebrow: 'Push & Delivery',
    impact: [
      'متابعة Expo push subscriptions والأجهزة والإصدارات النشطة.',
      'عرض Outbox ومحاولات الإرسال والأخطاء ووقت الإرسال.',
      'متابعة Expo ticket receipts وحالات نجاح وفشل كل Notification.',
    ],
  },
  system: {
    eyebrow: 'Platform Control',
    impact: [
      'التحكم في إعدادات التطبيق العامة والـfeature gates وMaintenance Mode.',
      'إدارة أعضاء Now Admin وصلاحياتهم.',
      'متابعة أخطاء تطبيق الموبايل المسجلة في قاعدة البيانات.',
      'عرض سجل ترحيل الوسائط ومراجع الـStorage.',
    ],
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

const MODE_LABEL: Record<NowAdminMutationMode, string> = {
  crud: 'إضافة · تعديل · حذف',
  'update-only': 'تعديل آمن',
  workflow: 'Workflow آمن',
  readonly: 'قراءة / Audit',
};

const MODE_CLASS: Record<NowAdminMutationMode, string> = {
  crud: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'update-only': 'bg-blue-50 text-blue-700 border-blue-200',
  workflow: 'bg-amber-50 text-amber-800 border-amber-200',
  readonly: 'bg-slate-100 text-slate-600 border-slate-200',
};

function getTableHref(definition: NowTableDefinition) {
  if (definition.table === 'app_settings') {
    return '/admin/now/settings';
  }

  if (definition.table === 'orders') {
    return '/admin/now/orders';
  }

  if (
    definition.mutationMode === 'workflow' ||
    [
      'order_payment_proofs',
      'prescription_submissions',
      'service_booking_payment_proofs',
      'service_bookings',
      'account_deletion_requests',
    ].includes(definition.table)
  ) {
    return '/admin/now/review';
  }

  return `/admin/now/data/${definition.table}`;
}

function getActionLabel(definition: NowTableDefinition) {
  if (definition.table === 'app_settings') return 'فتح إعدادات التطبيق';
  if (definition.table === 'orders') return 'فتح تشغيل الطلبات';
  if (definition.mutationMode === 'workflow') return 'فتح الـWorkflow';
  if (definition.mutationMode === 'readonly') return 'عرض السجل';
  return 'إدارة البيانات';
}

type PageProps = {
  params: Promise<{ section: string }>;
};

export default async function NowSectionPage({ params }: PageProps) {
  const { section } = await params;

  if (!(section in NOW_ADMIN_GROUPS)) {
    notFound();
  }

  const group = section as NowAdminGroup;
  const config = NOW_ADMIN_GROUPS[group];
  const meta = SECTION_META[group];
  const Icon = ICONS[group];
  const { tables, totalRecords } = await getNowSectionOverview(group);
  const failedCounts = tables.filter((table) => table.error);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
              <Icon size={14} />
              {meta.eyebrow}
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950">{config.labelAr}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {config.descriptionAr} هذا القسم ليس Dashboard للعرض فقط؛ كل Card بالأسفل يفتح
              مصدر البيانات الحقيقي أو الـworkflow الآمن الخاص به.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-3xl font-black">{tables.length}</p>
              <p className="mt-1 text-[11px] font-bold text-slate-400">مصادر بيانات</p>
            </div>
            <div className="rounded-2xl bg-violet-600 px-5 py-4 text-white">
              <p className="text-3xl font-black">{totalRecords.toLocaleString('en-US')}</p>
              <p className="mt-1 text-[11px] font-bold text-violet-100">سجل حالي</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
        <h3 className="font-black text-violet-950">ما الذي يتحكم فيه هذا القسم داخل التطبيق؟</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {meta.impact.map((item) => (
            <div key={item} className="flex gap-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {failedCounts.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          تعذر حساب عدد السجلات في {failedCounts.length} مصدر، لكن الوصول للبيانات ما زال متاحًا من
          الصفحات أدناه.
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">كل تفاصيل القسم</h3>
            <p className="mt-1 text-sm text-slate-500">
              لا يتم إخفاء أي جدول تابع لهذا الـdomain وراء Dashboard الطلبات.
            </p>
          </div>
          <Link
            href={`/admin/now/data?group=${group}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700"
          >
            <Database size={15} />
            Advanced Database View
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map(({ definition, count, error }) => (
            <Link
              key={definition.table}
              href={getTableHref(definition)}
              className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{definition.labelAr}</p>
                  <code className="mt-1 block text-[11px] font-bold text-slate-400">
                    now.{definition.table}
                  </code>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {error ? '—' : count.toLocaleString('en-US')}
                </span>
              </div>

              <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{definition.descriptionAr}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${MODE_CLASS[definition.mutationMode]}`}>
                  {MODE_LABEL[definition.mutationMode]}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-violet-700">
                  {getActionLabel(definition)}
                  <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
