import { createAdminClient } from '@/src/lib/supabase/admin';
import {
  Globe2,
  MapPinned,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';

import { inputClass, labelClass, Notice, PageHeader, textareaClass } from '../components/ui-kit';
import { requireNowTableAccess } from '../lib/table-data';
import { updateNowAppSettings } from './actions';

type Row = Record<string, unknown>;
function text(row: Row, key: string) { const value = row[key]; return value === null || value === undefined ? '' : String(value); }
function flag(row: Row, key: string) { return row[key] === true; }

function Toggle({ name, title, description, defaultChecked, danger = false }: { name: string; title: string; description: string; defaultChecked: boolean; danger?: boolean }) {
  return <label className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition ${danger ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50/60 hover:border-violet-200'}`}><span><span className="block text-sm font-black text-slate-900">{title}</span><span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{description}</span></span><input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 shrink-0 accent-violet-600" /></label>;
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="mb-5 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{icon}</span><div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p></div></div>;
}

export default async function NowSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireNowTableAccess('app_settings', true);
  const [params, settingsResult, citiesResult, areasResult] = await Promise.all([
    searchParams,
    createAdminClient().schema('now').from('app_settings').select('*').eq('singleton', true).single(),
    createAdminClient().schema('now').from('cities').select('id,name_ar,name_en,is_active').order('sort_order', { ascending: true }),
    createAdminClient().schema('now').from('service_areas').select('id,name_ar,name_en,city_id,is_active').order('sort_order', { ascending: true }),
  ]);
  if (settingsResult.error || !settingsResult.data) throw new Error(settingsResult.error?.message ?? 'تعذر تحميل إعدادات Navienty Now.');
  const settings = settingsResult.data as Row;
  const cities = (citiesResult.data ?? []) as Array<{ id: string; name_ar: string; name_en: string; is_active: boolean }>;
  const areas = (areasResult.data ?? []) as Array<{ id: string; name_ar: string; name_en: string; city_id: string; is_active: boolean }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="إعدادات عامة" title="إعدادات التطبيق" description="غيّر طريقة عمل Navienty Now من واجهة واحدة. الإعدادات الحساسة موجودة في أقسام واضحة ومش محتاجة تعامل مع قاعدة البيانات." icon={<Settings size={16} />} />
      {params.success ? <Notice tone="success" title={params.success} /> : null}
      {params.error ? <Notice tone="warning" title="تعذر حفظ الإعدادات">{params.error}</Notice> : null}
      {flag(settings, 'maintenance_mode') ? <Notice tone="warning" title="وضع الصيانة مفعّل الآن">قد لا يستطيع العملاء استخدام التطبيق بشكل طبيعي حتى يتم إيقافه.</Notice> : null}

      <form action={updateNowAppSettings} className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle icon={<Wrench size={17} />} title="تشغيل التطبيق" description="أهم مفاتيح التشغيل اليومية. استخدم وضع الصيانة فقط عند وجود سبب واضح." />
          <div className="grid gap-3 lg:grid-cols-2">
            <Toggle name="orders_enabled" title="استقبال الطلبات" description="عند إيقافه لن يتم استقبال طلبات جديدة." defaultChecked={flag(settings, 'orders_enabled')} />
            <Toggle name="catalog_enabled" title="عرض المتاجر والمنتجات" description="يتحكم في إتاحة الكتالوج للعملاء." defaultChecked={flag(settings, 'catalog_enabled')} />
            <Toggle name="location_geofencing_enabled" title="التحقق من منطقة التوصيل" description="يمنع الطلب من خارج مناطق التغطية المحددة." defaultChecked={flag(settings, 'location_geofencing_enabled')} />
            <Toggle name="maintenance_mode" title="وضع الصيانة" description="يُستخدم عند التحديثات أو المشكلات الطارئة. فعّله بحذر." defaultChecked={flag(settings, 'maintenance_mode')} danger />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2"><label className={labelClass}>رسالة الصيانة بالعربية<textarea name="maintenance_message_ar" defaultValue={text(settings, 'maintenance_message_ar')} className={textareaClass} /></label><label className={labelClass}>رسالة الصيانة بالإنجليزية<textarea name="maintenance_message_en" defaultValue={text(settings, 'maintenance_message_en')} className={textareaClass} /></label></div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle icon={<ShieldCheck size={17} />} title="التحقق والدفع" description="فعّل الخطوات الإضافية فقط عندما تكون عملية التشغيل جاهزة لمراجعتها." />
          <div className="grid gap-3 lg:grid-cols-2">
            <Toggle name="prescription_gate_enabled" title="مراجعة الروشتة" description="يطلب ويوقف الطلبات المقيدة لحين مراجعة الروشتة." defaultChecked={flag(settings, 'prescription_gate_enabled')} />
            <Toggle name="age_verification_gate_enabled" title="التحقق من العمر" description="يطلب تحقق الهوية للمنتجات المقيدة بالعمر." defaultChecked={flag(settings, 'age_verification_gate_enabled')} />
            <Toggle name="payment_proof_gate_enabled" title="إثبات دفع الطلب" description="يفرض مراجعة إثبات التحويل للطلبات التي تحتاجه." defaultChecked={flag(settings, 'payment_proof_gate_enabled')} />
            <Toggle name="service_booking_payment_proof_gate_enabled" title="إثبات دفع الخدمات" description="يفرض مراجعة الدفع لحجوزات الخدمات." defaultChecked={flag(settings, 'service_booking_payment_proof_gate_enabled')} />
          </div>
          <label className={`${labelClass} mt-4 max-w-sm`}>مدة معالجة طلب حذف الحساب بالأيام<input type="number" min={1} max={365} name="account_deletion_processing_days" required defaultValue={text(settings, 'account_deletion_processing_days')} className={inputClass} /></label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle icon={<MapPinned size={17} />} title="المنطقة الافتراضية" description="تُستخدم كنقطة بداية للتطبيق قبل اختيار العميل لموقع آخر." />
          <div className="grid gap-4 lg:grid-cols-2">
            <label className={labelClass}>المدينة الافتراضية<select name="default_city_id" defaultValue={text(settings, 'default_city_id')} className={inputClass}><option value="">بدون تحديد</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name_ar}{!city.is_active ? ' — غير نشطة' : ''}</option>)}</select></label>
            <label className={labelClass}>منطقة الخدمة الافتراضية<select name="default_service_area_id" defaultValue={text(settings, 'default_service_area_id')} className={inputClass}><option value="">بدون تحديد</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name_ar}{!area.is_active ? ' — غير نشطة' : ''}</option>)}</select></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle icon={<Smartphone size={17} />} title="التواصل والدعم" description="الأرقام والبيانات التي يعتمد عليها العميل للوصول لفريق Navienty Now." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className={labelClass}>واتساب الطلبات<input name="whatsapp_number" defaultValue={text(settings, 'whatsapp_number')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>هاتف الدعم<input name="support_phone" defaultValue={text(settings, 'support_phone')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>واتساب الدعم<input name="support_whatsapp" defaultValue={text(settings, 'support_whatsapp')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>بريد الدعم<input type="email" name="support_email" defaultValue={text(settings, 'support_email')} dir="ltr" className={inputClass} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle icon={<Globe2 size={17} />} title="هوية التطبيق وإعدادات أقل استخدامًا" description="غالبًا لا تحتاج لتغييرها في التشغيل اليومي." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClass}>اسم التطبيق<input name="app_name" required defaultValue={text(settings, 'app_name')} className={inputClass} /></label>
            <label className={labelClass}>App Slug<input name="app_slug" required defaultValue={text(settings, 'app_slug')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>رابط الشعار<input type="url" name="app_logo_url" defaultValue={text(settings, 'app_logo_url')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>اللغة الافتراضية<select name="default_locale" required defaultValue={text(settings, 'default_locale')} className={inputClass}><option value="ar">العربية</option><option value="en">English</option></select></label>
            <label className={labelClass}>المنطقة الزمنية<input name="timezone" required defaultValue={text(settings, 'timezone')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>أقل إصدار مدعوم<input name="minimum_supported_app_version" defaultValue={text(settings, 'minimum_supported_app_version')} dir="ltr" className={inputClass} placeholder="1.0.0" /></label>
            <label className={labelClass}>كود العملة<input name="currency_code" required defaultValue={text(settings, 'currency_code')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>رمز العملة<input name="currency_symbol" required defaultValue={text(settings, 'currency_symbol')} className={inputClass} /></label>
            <label className={labelClass}>رابط الخصوصية<input type="url" name="privacy_url" defaultValue={text(settings, 'privacy_url')} dir="ltr" className={inputClass} /></label>
            <label className={labelClass}>رابط الشروط<input type="url" name="terms_url" defaultValue={text(settings, 'terms_url')} dir="ltr" className={inputClass} /></label>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-sm shadow-violet-200 hover:bg-violet-700"><Save size={17} /> حفظ الإعدادات</button></div>
      </form>
    </div>
  );
}
