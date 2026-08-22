import { createAdminClient } from '@/src/lib/supabase/admin';
import {
  AlertTriangle,
  Globe2,
  MapPinned,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { requireNowTableAccess } from '../lib/table-data';
import { updateNowAppSettings } from './actions';

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const current = row[key];
  return current === null || current === undefined ? '' : String(current);
}

function flag(row: Row, key: string) {
  return row[key] === true;
}

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';
const labelClass = 'block text-xs font-black text-slate-700';

function Toggle({
  name,
  title,
  description,
  defaultChecked,
  danger = false,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 ${
        danger ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
      }`}
    >
      <span>
        <span className="block text-sm font-black text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-5 w-5 shrink-0 accent-violet-600"
      />
    </label>
  );
}

export default async function NowSettingsPage({ searchParams }: PageProps) {
  await requireNowTableAccess('app_settings', true);
  const params = await searchParams;
  const admin = createAdminClient();

  const [settingsResult, citiesResult, areasResult] = await Promise.all([
    admin.schema('now').from('app_settings').select('*').eq('singleton', true).single(),
    admin
      .schema('now')
      .from('cities')
      .select('id,name_ar,name_en,is_active')
      .order('sort_order', { ascending: true }),
    admin
      .schema('now')
      .from('service_areas')
      .select('id,name_ar,name_en,city_id,is_active')
      .order('sort_order', { ascending: true }),
  ]);

  if (settingsResult.error || !settingsResult.data) {
    throw new Error(settingsResult.error?.message ?? 'تعذر تحميل إعدادات Navienty Now.');
  }

  const settings = settingsResult.data as Row;
  const cities = (citiesResult.data ?? []) as Array<Record<string, unknown>>;
  const areas = (areasResult.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-violet-200">
              <Settings size={14} />
              Live App Configuration
            </div>
            <h2 className="mt-4 text-3xl font-black">إعدادات Navienty Now</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              هذه القيم تقرأها أجزاء من التطبيق والـbackend مباشرة. التعديل هنا يغيّر سلوك Now،
              لذلك جمعتها في واجهة واضحة بدل تعديل JSON يدوي.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-bold text-slate-300">
            آخر تحديث
            <strong className="mt-1 block text-sm text-white">{text(settings, 'updated_at') || '—'}</strong>
          </div>
        </div>
      </section>

      {params.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
          {params.success}
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-800">
          {params.error}
        </div>
      ) : null}

      <form action={updateNowAppSettings} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Smartphone className="text-violet-600" size={20} />
            <div>
              <h3 className="font-black">هوية التطبيق والإصدار</h3>
              <p className="text-xs text-slate-500">الاسم، الهوية، اللغة، العملة والحد الأدنى للإصدار.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClass}>
              اسم التطبيق
              <input className={inputClass} name="app_name" defaultValue={text(settings, 'app_name')} required />
            </label>
            <label className={labelClass}>
              App Slug
              <input className={inputClass} name="app_slug" defaultValue={text(settings, 'app_slug')} required dir="ltr" />
            </label>
            <label className={labelClass}>
              Logo URL
              <input className={inputClass} name="app_logo_url" defaultValue={text(settings, 'app_logo_url')} dir="ltr" />
            </label>
            <label className={labelClass}>
              اللغة الافتراضية
              <select className={inputClass} name="default_locale" defaultValue={text(settings, 'default_locale') || 'ar'}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className={labelClass}>
              Timezone
              <input className={inputClass} name="timezone" defaultValue={text(settings, 'timezone')} required dir="ltr" />
            </label>
            <label className={labelClass}>
              Minimum Supported App Version
              <input className={inputClass} name="minimum_supported_app_version" defaultValue={text(settings, 'minimum_supported_app_version')} placeholder="1.0.0" dir="ltr" />
            </label>
            <label className={labelClass}>
              Currency Code
              <input className={inputClass} name="currency_code" defaultValue={text(settings, 'currency_code')} required dir="ltr" />
            </label>
            <label className={labelClass}>
              رمز العملة
              <input className={inputClass} name="currency_symbol" defaultValue={text(settings, 'currency_symbol')} required />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <MapPinned className="text-violet-600" size={20} />
            <div>
              <h3 className="font-black">الجغرافيا والتغطية الافتراضية</h3>
              <p className="text-xs text-slate-500">المدينة والمنطقة التي يعتمد عليها Bootstrap والـlocation fallback.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              المدينة الافتراضية
              <select className={inputClass} name="default_city_id" defaultValue={text(settings, 'default_city_id')}>
                <option value="">بدون مدينة افتراضية</option>
                {cities.map((city) => (
                  <option key={String(city.id)} value={String(city.id)}>
                    {String(city.name_ar ?? city.name_en ?? city.id)}{city.is_active === false ? ' — غير نشطة' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              منطقة الخدمة الافتراضية
              <select className={inputClass} name="default_service_area_id" defaultValue={text(settings, 'default_service_area_id')}>
                <option value="">بدون منطقة افتراضية</option>
                {areas.map((area) => (
                  <option key={String(area.id)} value={String(area.id)}>
                    {String(area.name_ar ?? area.name_en ?? area.id)}{area.is_active === false ? ' — غير نشطة' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4">
            <Toggle
              name="location_geofencing_enabled"
              title="تفعيل Geofencing"
              description="عند التفعيل يعتمد التطبيق على حدود مناطق الخدمة بدل fallback المفتوح."
              defaultChecked={flag(settings, 'location_geofencing_enabled')}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Globe2 className="text-violet-600" size={20} />
            <div>
              <h3 className="font-black">الدعم والتواصل والسياسات</h3>
              <p className="text-xs text-slate-500">الأرقام والروابط التي يمكن أن تظهر للعميل أو تستخدمها الرحلة التشغيلية.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['whatsapp_number', 'رقم WhatsApp الأساسي'],
              ['support_phone', 'هاتف الدعم'],
              ['support_whatsapp', 'WhatsApp الدعم'],
              ['support_email', 'بريد الدعم'],
              ['privacy_url', 'Privacy URL'],
              ['terms_url', 'Terms URL'],
            ].map(([name, label]) => (
              <label key={name} className={labelClass}>
                {label}
                <input className={inputClass} name={name} defaultValue={text(settings, name)} dir="ltr" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="text-violet-600" size={20} />
            <div>
              <h3 className="font-black">Feature Gates والتشغيل</h3>
              <p className="text-xs text-slate-500">مفاتيح تتحكم في إمكانيات التطبيق ومسارات الامتثال والدفع.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle name="catalog_enabled" title="تشغيل الكتالوج" description="السماح بعرض كتالوج Navienty Now." defaultChecked={flag(settings, 'catalog_enabled')} />
            <Toggle name="orders_enabled" title="تشغيل الطلبات" description="السماح بإنشاء الطلبات من التطبيق." defaultChecked={flag(settings, 'orders_enabled')} />
            <Toggle name="prescription_gate_enabled" title="بوابة الروشتة" description="فرض مسار الروشتة عند الحاجة للمنتجات المقيدة." defaultChecked={flag(settings, 'prescription_gate_enabled')} />
            <Toggle name="age_verification_gate_enabled" title="بوابة التحقق العمري" description="فرض التحقق العمري للمنتجات المقيدة." defaultChecked={flag(settings, 'age_verification_gate_enabled')} />
            <Toggle name="payment_proof_gate_enabled" title="إثبات دفع الطلبات" description="تفعيل مسار رفع ومراجعة إثبات الدفع للطلبات." defaultChecked={flag(settings, 'payment_proof_gate_enabled')} />
            <Toggle name="service_booking_payment_proof_gate_enabled" title="إثبات دفع الخدمات" description="تفعيل إثبات الدفع لحجوزات الخدمات." defaultChecked={flag(settings, 'service_booking_payment_proof_gate_enabled')} />
          </div>
          <label className={`${labelClass} mt-4 max-w-sm`}>
            مدة معالجة حذف الحساب بالأيام
            <input className={inputClass} type="number" min={1} max={365} name="account_deletion_processing_days" defaultValue={text(settings, 'account_deletion_processing_days') || '30'} required />
          </label>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-amber-700" size={20} />
            <div>
              <h3 className="font-black text-amber-950">Maintenance Mode</h3>
              <p className="mt-1 text-xs leading-5 text-amber-800">هذا المفتاح يؤثر مباشرة على إمكانية استخدام التطبيق. راجع الرسالة قبل التفعيل.</p>
            </div>
          </div>
          <Toggle name="maintenance_mode" title="تفعيل وضع الصيانة" description="أوقف التجربة الطبيعية وأظهر رسالة الصيانة المخصصة." defaultChecked={flag(settings, 'maintenance_mode')} danger />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              رسالة الصيانة بالعربية
              <textarea className={`${inputClass} min-h-24`} name="maintenance_message_ar" defaultValue={text(settings, 'maintenance_message_ar')} />
            </label>
            <label className={labelClass}>
              Maintenance Message EN
              <textarea className={`${inputClass} min-h-24`} name="maintenance_message_en" defaultValue={text(settings, 'maintenance_message_en')} dir="ltr" />
            </label>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700">
            <Save size={18} />
            حفظ كل إعدادات Now
          </button>
        </div>
      </form>
    </div>
  );
}
