import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ImageIcon,
  Megaphone,
  Plus,
  ReceiptText,
  Store,
  TicketPercent,
  Users,
} from 'lucide-react';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { Notice, PageHeader, inputClass, labelClass, textareaClass } from '../../components/ui-kit';
import { requireNowTableAccess } from '../../lib/table-data';
import {
  createMarketingBanner,
  createMarketingVoucher,
  toggleMarketingBanner,
  toggleMarketingVoucher,
  updateMarketingBanner,
  updateMarketingVoucher,
} from './actions';

type Banner = {
  id: string;
  admin_label: string;
  image_url: string;
  alt_text_ar: string | null;
  audience: string;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  placement: string;
  store_id: string | null;
  presentation_type: string;
  action_type: string;
};

type Voucher = {
  id: string;
  code: string;
  title_ar: string;
  description_ar: string | null;
  discount_type: string;
  discount_value: number | string;
  max_discount_amount: number | string | null;
  minimum_subtotal: number | string;
  store_id: string | null;
  category_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions_total: number | null;
  max_redemptions_per_user: number | null;
  first_order_only: boolean;
  is_active: boolean;
  discount_target: string;
};

type Redemption = {
  id: string;
  voucher_id: string;
  order_id: string;
  customer_phone_snapshot: string;
  discount_amount: number | string;
  status: string;
  reserved_at: string;
  redeemed_at: string | null;
  created_at: string;
};

type StoreRow = { id: string; name_ar: string; category_id: string };
type CategoryRow = { id: string; name_ar: string };
type SimpleBannerLink = { banner_id: string };

const TAB_META = {
  overview: { label: 'نظرة عامة', icon: ChartNoAxesCombined },
  offers: { label: 'العروض والبانرات', icon: Megaphone },
  coupons: { label: 'الكوبونات', icon: TicketPercent },
  usage: { label: 'استخدام الكوبونات', icon: ReceiptText },
} as const;

type MarketingTab = keyof typeof TAB_META;

const PLACEMENT_LABELS: Record<string, string> = {
  main: 'الرئيسية',
  exclusive_offers: 'عروض حصرية',
  supermarket: 'السوبرماركت',
  pharmacy: 'الصيدلية',
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'كل العملاء',
  signed_out: 'غير مسجلين',
  signed_in: 'مسجلين فقط',
};

const ACTION_LABELS: Record<string, string> = {
  none: 'بدون إجراء',
  whatsapp: 'واتساب',
  external_url: 'رابط خارجي',
  category: 'فتح فئة',
  store: 'فتح متجر',
  route: 'فتح شاشة',
  service_checkout: 'حجز خدمة',
};

function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'بدون تاريخ';
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function localDateTimeValue(value: string | null | undefined) {
  if (!value) return '';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(value)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function bannerStatus(banner: Banner) {
  const now = Date.now();
  if (!banner.is_active) return { key: 'paused', label: 'متوقف', className: 'bg-slate-100 text-slate-600' };
  if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return { key: 'scheduled', label: 'مجدول', className: 'bg-sky-100 text-sky-700' };
  if (banner.ends_at && new Date(banner.ends_at).getTime() <= now) return { key: 'ended', label: 'منتهي', className: 'bg-rose-100 text-rose-700' };
  return { key: 'live', label: 'شغال الآن', className: 'bg-emerald-100 text-emerald-700' };
}

function voucherStatus(voucher: Voucher, redeemedCount: number) {
  const now = Date.now();
  if (!voucher.is_active) return { key: 'paused', label: 'متوقف', className: 'bg-slate-100 text-slate-600' };
  if (voucher.max_redemptions_total && redeemedCount >= voucher.max_redemptions_total) return { key: 'exhausted', label: 'وصل للحد', className: 'bg-amber-100 text-amber-800' };
  if (voucher.starts_at && new Date(voucher.starts_at).getTime() > now) return { key: 'scheduled', label: 'مجدول', className: 'bg-sky-100 text-sky-700' };
  if (voucher.ends_at && new Date(voucher.ends_at).getTime() <= now) return { key: 'ended', label: 'منتهي', className: 'bg-rose-100 text-rose-700' };
  return { key: 'live', label: 'فعال', className: 'bg-emerald-100 text-emerald-700' };
}

function discountLabel(voucher: Voucher) {
  if (voucher.discount_type === 'percentage') {
    return `${Number(voucher.discount_value).toLocaleString('ar-EG')}%`;
  }
  return money(voucher.discount_value);
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Megaphone; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Icon size={20} /></span>
      </div>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Megaphone className="mx-auto text-slate-300" size={40} />
      <p className="mt-3 font-black text-slate-800">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
    </div>
  );
}

export default async function MarketingControlCenter({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
}) {
  await Promise.all([
    requireNowTableAccess('home_banners'),
    requireNowTableAccess('vouchers'),
    requireNowTableAccess('voucher_redemptions'),
  ]);

  const query = await searchParams;
  const tab: MarketingTab = query.tab && query.tab in TAB_META ? query.tab as MarketingTab : 'overview';
  const admin = createAdminClient();

  const [bannerResult, voucherResult, redemptionResult, storesResult, categoriesResult, imagesResult, productsResult, areasResult] = await Promise.all([
    admin.schema('now').from('home_banners').select('id,admin_label,image_url,alt_text_ar,audience,sort_order,is_active,starts_at,ends_at,placement,store_id,presentation_type,action_type').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    admin.schema('now').from('vouchers').select('id,code,title_ar,description_ar,discount_type,discount_value,max_discount_amount,minimum_subtotal,store_id,category_id,starts_at,ends_at,max_redemptions_total,max_redemptions_per_user,first_order_only,is_active,discount_target').order('created_at', { ascending: false }),
    admin.schema('now').from('voucher_redemptions').select('id,voucher_id,order_id,customer_phone_snapshot,discount_amount,status,reserved_at,redeemed_at,created_at').order('created_at', { ascending: false }).limit(5000),
    admin.schema('now').from('stores').select('id,name_ar,category_id').eq('is_active', true).order('name_ar', { ascending: true }),
    admin.schema('now').from('store_categories').select('id,name_ar').order('sort_order', { ascending: true }),
    admin.schema('now').from('home_banner_images').select('banner_id').eq('is_active', true),
    admin.schema('now').from('home_banner_products').select('banner_id').eq('is_active', true),
    admin.schema('now').from('home_banner_service_areas').select('banner_id'),
  ]);

  const firstError = [bannerResult.error, voucherResult.error, redemptionResult.error, storesResult.error, categoriesResult.error].find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const banners = (bannerResult.data ?? []) as Banner[];
  const vouchers = (voucherResult.data ?? []) as Voucher[];
  const redemptions = (redemptionResult.data ?? []) as Redemption[];
  const stores = (storesResult.data ?? []) as StoreRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const storeMap = new Map(stores.map((store) => [store.id, store]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const bannerImageCounts = new Map<string, number>();
  const bannerProductCounts = new Map<string, number>();
  const bannerAreaCounts = new Map<string, number>();
  for (const row of (imagesResult.data ?? []) as SimpleBannerLink[]) bannerImageCounts.set(row.banner_id, (bannerImageCounts.get(row.banner_id) ?? 0) + 1);
  for (const row of (productsResult.data ?? []) as SimpleBannerLink[]) bannerProductCounts.set(row.banner_id, (bannerProductCounts.get(row.banner_id) ?? 0) + 1);
  for (const row of (areasResult.data ?? []) as SimpleBannerLink[]) bannerAreaCounts.set(row.banner_id, (bannerAreaCounts.get(row.banner_id) ?? 0) + 1);

  const redemptionsByVoucher = new Map<string, Redemption[]>();
  for (const redemption of redemptions) {
    const current = redemptionsByVoucher.get(redemption.voucher_id) ?? [];
    current.push(redemption);
    redemptionsByVoucher.set(redemption.voucher_id, current);
  }

  const liveBanners = banners.filter((banner) => bannerStatus(banner).key === 'live').length;
  const scheduledBanners = banners.filter((banner) => bannerStatus(banner).key === 'scheduled').length;
  const liveVouchers = vouchers.filter((voucher) => {
    const redeemedCount = (redemptionsByVoucher.get(voucher.id) ?? []).filter((item) => item.status === 'redeemed').length;
    return voucherStatus(voucher, redeemedCount).key === 'live';
  }).length;
  const totalRedeemedDiscount = redemptions.filter((item) => item.status === 'redeemed').reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التسويق والعروض"
        title="العروض والكوبونات"
        description="واجهة واحدة واضحة لتشغيل الحملات، معرفة ما يعمل الآن، وإدارة الكوبونات بدون التعامل مع جداول تقنية."
        icon={<Megaphone size={16} />}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/now/sections/marketing?tab=offers#new-offer" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-sm"><Plus size={15} /> عرض جديد</Link>
            <Link href="/admin/now/sections/marketing?tab=coupons#new-coupon" className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-black text-violet-700"><TicketPercent size={15} /> كوبون جديد</Link>
          </div>
        )}
      />

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Megaphone} label="عروض شغالة الآن" value={liveBanners.toLocaleString('ar-EG')} hint={`من أصل ${banners.length.toLocaleString('ar-EG')} عرض`} />
        <StatCard icon={CalendarClock} label="عروض مجدولة" value={scheduledBanners.toLocaleString('ar-EG')} hint="ستبدأ تلقائيًا في موعدها" />
        <StatCard icon={TicketPercent} label="كوبونات فعالة" value={liveVouchers.toLocaleString('ar-EG')} hint={`من أصل ${vouchers.length.toLocaleString('ar-EG')} كوبون`} />
        <StatCard icon={CircleDollarSign} label="خصومات صُرفت" value={money(totalRedeemedDiscount)} hint="من استخدامات الكوبونات المسجلة" />
      </section>

      <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:grid-cols-4">
        {(Object.entries(TAB_META) as Array<[MarketingTab, (typeof TAB_META)[MarketingTab]]>).map(([key, item]) => {
          const Icon = item.icon;
          return (
            <Link key={key} href={`/admin/now/sections/marketing?tab=${key}`} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition sm:text-sm ${tab === key ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={16} /> {item.label}
            </Link>
          );
        })}
      </nav>

      {tab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">العروض الحالية</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">أهم ما يظهر للعميل الآن أو سيظهر قريبًا.</p>
              </div>
              <Link href="/admin/now/sections/marketing?tab=offers" className="inline-flex items-center gap-1 text-xs font-black text-violet-700">كل العروض <ArrowLeft size={14} /></Link>
            </div>
            <div className="mt-5 space-y-3">
              {banners.slice(0, 4).map((banner) => {
                const status = bannerStatus(banner);
                return (
                  <div key={banner.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image src={banner.image_url} alt={banner.alt_text_ar || banner.admin_label} fill sizes="96px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-900">{banner.admin_label}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">{PLACEMENT_LABELS[banner.placement] ?? banner.placement} · {AUDIENCE_LABELS[banner.audience] ?? banner.audience}</p>
                    </div>
                  </div>
                );
              })}
              {banners.length === 0 ? <p className="py-8 text-center text-xs font-bold text-slate-400">لا توجد عروض حتى الآن.</p> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">الكوبونات</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">الحالة والاستخدام بدون فتح تفاصيل تقنية.</p>
              </div>
              <Link href="/admin/now/sections/marketing?tab=coupons" className="inline-flex items-center gap-1 text-xs font-black text-violet-700">كل الكوبونات <ArrowLeft size={14} /></Link>
            </div>
            <div className="mt-5 space-y-3">
              {vouchers.slice(0, 4).map((voucher) => {
                const voucherRedemptions = redemptionsByVoucher.get(voucher.id) ?? [];
                const redeemed = voucherRedemptions.filter((item) => item.status === 'redeemed').length;
                const status = voucherStatus(voucher, redeemed);
                return (
                  <div key={voucher.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <code dir="ltr" className="rounded-lg bg-slate-950 px-2.5 py-1 text-sm font-black text-white">{voucher.code}</code>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-900">{voucher.title_ar}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black text-violet-700">{discountLabel(voucher)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{voucher.discount_target === 'delivery_fee' ? 'من التوصيل' : 'من الطلب'}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-500">اُستخدم {redeemed.toLocaleString('ar-EG')} مرة{voucher.max_redemptions_total ? ` من ${voucher.max_redemptions_total.toLocaleString('ar-EG')}` : ''}</p>
                  </div>
                );
              })}
              {vouchers.length === 0 ? <p className="py-8 text-center text-xs font-bold text-slate-400">لا توجد كوبونات حتى الآن.</p> : null}
            </div>
          </section>

          <section className="xl:col-span-2 rounded-3xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white"><BadgePercent size={18} /></span>
              <div>
                <h2 className="font-black text-violet-950">طريقة العمل الجديدة</h2>
                <p className="mt-1 text-xs font-semibold leading-6 text-violet-800">العروض والكوبونات هي الواجهة الأساسية. ربط المنتجات والمناطق والصور الإضافية ما زال متاحًا، لكنه أصبح تحت الأدوات المتقدمة بدل ما يشتت التشغيل اليومي.</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'offers' ? (
        <div className="space-y-6">
          <section id="new-offer" className="scroll-mt-6 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Plus size={18} /></span>
              <div>
                <h2 className="text-lg font-black text-slate-950">إضافة عرض جديد</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">المعلومات المهمة فقط. الإعدادات المعقدة تقدر تضبطها لاحقًا من الأدوات المتقدمة.</p>
              </div>
            </div>
            <form action={createMarketingBanner} className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className={labelClass}>اسم داخلي للعرض *<input name="admin_label" required className={inputClass} placeholder="مثال: خصم بداية الدراسة" /></label>
                <label className={labelClass}>مكان الظهور<select name="placement" defaultValue="main" className={inputClass}><option value="main">الرئيسية</option><option value="exclusive_offers">عروض حصرية</option><option value="supermarket">السوبرماركت</option><option value="pharmacy">الصيدلية</option></select></label>
                <label className={labelClass}>الجمهور<select name="audience" defaultValue="all" className={inputClass}><option value="all">كل العملاء</option><option value="signed_in">المسجلون فقط</option><option value="signed_out">غير المسجلين</option></select></label>
                <label className={labelClass}>صورة العرض *<input name="image" type="file" required accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} /><span className="text-[10px] font-semibold text-slate-400">JPG / PNG / WEBP — حد أقصى 10MB</span></label>
                <label className={labelClass}>المتجر المرتبط<select name="store_id" defaultValue="" className={inputClass}><option value="">بدون متجر محدد</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name_ar}</option>)}</select></label>
                <label className={labelClass}>الترتيب<input name="sort_order" type="number" min="0" defaultValue="0" className={inputClass} /></label>
                <label className={labelClass}>يبدأ في — بتوقيت القاهرة<input name="starts_at" type="datetime-local" className={inputClass} /></label>
                <label className={labelClass}>ينتهي في — بتوقيت القاهرة<input name="ends_at" type="datetime-local" className={inputClass} /></label>
                <label className={labelClass}>النص البديل للصورة<input name="alt_text_ar" className={inputClass} placeholder="وصف مختصر للصورة" /></label>
              </div>
              <details className="rounded-2xl border border-slate-200 bg-slate-50/60">
                <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-600">إعدادات فتح العرض</summary>
                <div className="grid gap-4 border-t border-slate-200 p-4 md:grid-cols-2">
                  <label className={labelClass}>طريقة العرض<select name="presentation_type" defaultValue="direct_link" className={inputClass}><option value="direct_link">فتح مباشر</option><option value="detail_screen">صفحة تفاصيل للعرض</option></select></label>
                  <label className={labelClass}>بعد الضغط<select name="action_type" defaultValue="none" className={inputClass}><option value="none">بدون إجراء</option><option value="store">فتح متجر</option><option value="category">فتح فئة</option><option value="route">فتح شاشة</option><option value="whatsapp">واتساب</option><option value="external_url">رابط خارجي</option><option value="service_checkout">حجز خدمة</option></select></label>
                </div>
              </details>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"><input name="is_active" type="checkbox" defaultChecked className="h-5 w-5 accent-emerald-600" /> تشغيل العرض بعد الحفظ</label>
              <div className="flex justify-end border-t border-slate-100 pt-4"><button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white"><Plus size={16} /> إنشاء العرض</button></div>
            </form>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-950">كل العروض</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">الصورة، مكان الظهور، الجمهور والحالة قدامك مباشرة.</p>
            </div>
            {banners.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {banners.map((banner) => {
                  const status = bannerStatus(banner);
                  const linkedStore = banner.store_id ? storeMap.get(banner.store_id) : null;
                  return (
                    <article key={banner.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="grid sm:grid-cols-[220px_1fr]">
                        <div className="relative min-h-44 bg-slate-100 sm:min-h-full">
                          <Image src={banner.image_url} alt={banner.alt_text_ar || banner.admin_label} fill sizes="220px" className="object-cover" />
                        </div>
                        <div className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">{PLACEMENT_LABELS[banner.placement] ?? banner.placement}</span></div>
                              <h3 className="mt-2 text-lg font-black text-slate-950">{banner.admin_label}</h3>
                            </div>
                            <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">#{banner.sort_order}</span>
                          </div>
                          <div className="mt-4 grid gap-2 text-[11px] font-bold text-slate-500 sm:grid-cols-2">
                            <p className="flex items-center gap-2"><Users size={13} className="text-violet-500" /> {AUDIENCE_LABELS[banner.audience] ?? banner.audience}</p>
                            <p className="flex items-center gap-2"><Store size={13} className="text-violet-500" /> {linkedStore?.name_ar || 'غير مرتبط بمتجر'}</p>
                            <p className="flex items-center gap-2"><CalendarClock size={13} className="text-violet-500" /> البداية: {banner.starts_at ? formatDate(banner.starts_at) : 'فوري'}</p>
                            <p className="flex items-center gap-2"><CalendarClock size={13} className="text-violet-500" /> النهاية: {banner.ends_at ? formatDate(banner.ends_at) : 'مفتوح'}</p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black text-slate-500">
                            <span className="rounded-lg bg-slate-100 px-2 py-1">{bannerImageCounts.get(banner.id) ?? 0} صور إضافية</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1">{bannerProductCounts.get(banner.id) ?? 0} منتجات</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1">{bannerAreaCounts.get(banner.id) ?? 0} مناطق</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1">{ACTION_LABELS[banner.action_type] ?? banner.action_type}</span>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <details className="group flex-1 rounded-xl border border-slate-200">
                              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-violet-700">تعديل العرض <ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
                              <div className="border-t border-slate-200 p-4">
                                <form action={updateMarketingBanner} className="space-y-4">
                                  <input type="hidden" name="id" value={banner.id} />
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <label className={labelClass}>اسم العرض<input name="admin_label" required defaultValue={banner.admin_label} className={inputClass} /></label>
                                    <label className={labelClass}>مكان الظهور<select name="placement" defaultValue={banner.placement} className={inputClass}><option value="main">الرئيسية</option><option value="exclusive_offers">عروض حصرية</option><option value="supermarket">السوبرماركت</option><option value="pharmacy">الصيدلية</option></select></label>
                                    <label className={labelClass}>الجمهور<select name="audience" defaultValue={banner.audience} className={inputClass}><option value="all">كل العملاء</option><option value="signed_in">المسجلون فقط</option><option value="signed_out">غير المسجلين</option></select></label>
                                    <label className={labelClass}>المتجر<select name="store_id" defaultValue={banner.store_id ?? ''} className={inputClass}><option value="">بدون متجر</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name_ar}</option>)}</select></label>
                                    <label className={labelClass}>الترتيب<input name="sort_order" type="number" min="0" defaultValue={banner.sort_order} className={inputClass} /></label>
                                    <label className={labelClass}>استبدال الصورة<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} /></label>
                                    <label className={labelClass}>البداية<input name="starts_at" type="datetime-local" defaultValue={localDateTimeValue(banner.starts_at)} className={inputClass} /></label>
                                    <label className={labelClass}>النهاية<input name="ends_at" type="datetime-local" defaultValue={localDateTimeValue(banner.ends_at)} className={inputClass} /></label>
                                    <label className={`${labelClass} md:col-span-2`}>النص البديل<input name="alt_text_ar" defaultValue={banner.alt_text_ar ?? ''} className={inputClass} /></label>
                                    <label className={labelClass}>طريقة العرض<select name="presentation_type" defaultValue={banner.presentation_type} className={inputClass}><option value="direct_link">فتح مباشر</option><option value="detail_screen">صفحة تفاصيل</option></select></label>
                                    <label className={labelClass}>الإجراء<select name="action_type" defaultValue={banner.action_type} className={inputClass}><option value="none">بدون إجراء</option><option value="store">فتح متجر</option><option value="category">فتح فئة</option><option value="route">فتح شاشة</option><option value="whatsapp">واتساب</option><option value="external_url">رابط خارجي</option><option value="service_checkout">حجز خدمة</option></select></label>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-black text-emerald-700"><input name="is_active" type="checkbox" defaultChecked={banner.is_active} className="h-4 w-4 accent-emerald-600" /> العرض مفعّل</label>
                                  <button className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">حفظ التعديلات</button>
                                </form>
                              </div>
                            </details>
                            <form action={toggleMarketingBanner}>
                              <input type="hidden" name="id" value={banner.id} /><input type="hidden" name="next_active" value={banner.is_active ? 'false' : 'true'} />
                              <button className={`rounded-xl px-4 py-2.5 text-xs font-black ${banner.is_active ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'bg-emerald-600 text-white'}`}>{banner.is_active ? 'إيقاف' : 'تشغيل'}</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <EmptyPanel title="لا توجد عروض" description="أضف أول عرض من النموذج الموجود بالأعلى." />}
          </section>
        </div>
      ) : null}

      {tab === 'coupons' ? (
        <div className="space-y-6">
          <section id="new-coupon" className="scroll-mt-6 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><TicketPercent size={18} /></span><div><h2 className="text-lg font-black text-slate-950">إنشاء كوبون</h2><p className="mt-1 text-xs font-semibold text-slate-500">القواعد مكتوبة بلغة بسيطة: الخصم، الحد الأدنى، لمن يظهر، وكم مرة يمكن استخدامه.</p></div></div>
            <form action={createMarketingVoucher} className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className={labelClass}>كود الكوبون *<input name="code" required dir="ltr" className={inputClass} placeholder="WELCOME20" /></label>
                <label className={labelClass}>اسم الكوبون *<input name="title_ar" required className={inputClass} placeholder="خصم ترحيبي" /></label>
                <label className={labelClass}>الخصم على<select name="discount_target" defaultValue="order_subtotal" className={inputClass}><option value="order_subtotal">قيمة المنتجات</option><option value="delivery_fee">رسوم التوصيل</option></select></label>
                <label className={labelClass}>نوع الخصم<select name="discount_type" defaultValue="percentage" className={inputClass}><option value="percentage">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option></select></label>
                <label className={labelClass}>قيمة الخصم *<input name="discount_value" required type="number" min="0.01" step="0.01" className={inputClass} /></label>
                <label className={labelClass}>أقصى خصم للنسبة<input name="max_discount_amount" type="number" min="0.01" step="0.01" className={inputClass} placeholder="اختياري" /></label>
                <label className={labelClass}>الحد الأدنى للطلب<input name="minimum_subtotal" type="number" min="0" step="0.01" defaultValue="0" className={inputClass} /></label>
                <label className={labelClass}>متجر محدد<select name="store_id" defaultValue="" className={inputClass}><option value="">كل المتاجر</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name_ar}</option>)}</select></label>
                <label className={labelClass}>فئة متاجر محددة<select name="category_id" defaultValue="" className={inputClass}><option value="">كل الفئات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}</select></label>
                <label className={labelClass}>يبدأ في — القاهرة<input name="starts_at" type="datetime-local" className={inputClass} /></label>
                <label className={labelClass}>ينتهي في — القاهرة<input name="ends_at" type="datetime-local" className={inputClass} /></label>
                <label className={labelClass}>إجمالي مرات الاستخدام<input name="max_redemptions_total" type="number" min="1" className={inputClass} placeholder="بدون حد" /></label>
                <label className={labelClass}>لكل عميل<input name="max_redemptions_per_user" type="number" min="1" defaultValue="1" className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>وصف مختصر<textarea name="description_ar" className={textareaClass} placeholder="الشروط أو الرسالة التي تريد أن يفهمها فريق التشغيل" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><input name="first_order_only" type="checkbox" className="h-5 w-5 accent-violet-600" /> لأول طلب فقط</label><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800"><input name="is_active" type="checkbox" defaultChecked className="h-5 w-5 accent-emerald-600" /> تشغيل الكوبون بعد الحفظ</label></div>
              <div className="flex justify-end border-t border-slate-100 pt-4"><button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white"><Plus size={16} /> إنشاء الكوبون</button></div>
            </form>
          </section>

          <section>
            <div className="mb-4"><h2 className="text-xl font-black text-slate-950">كل الكوبونات</h2><p className="mt-1 text-xs font-semibold text-slate-500">القيمة، النطاق، الشروط والاستخدام ظاهرين في بطاقة واحدة.</p></div>
            {vouchers.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {vouchers.map((voucher) => {
                  const voucherRedemptions = redemptionsByVoucher.get(voucher.id) ?? [];
                  const redeemed = voucherRedemptions.filter((item) => item.status === 'redeemed').length;
                  const reserved = voucherRedemptions.filter((item) => item.status === 'reserved').length;
                  const discountSpent = voucherRedemptions.filter((item) => item.status === 'redeemed').reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
                  const status = voucherStatus(voucher, redeemed);
                  const linkedStore = voucher.store_id ? storeMap.get(voucher.store_id) : null;
                  const linkedCategory = voucher.category_id ? categoryMap.get(voucher.category_id) : null;
                  return (
                    <article key={voucher.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div><div className="flex flex-wrap items-center gap-2"><code dir="ltr" className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-sm font-black text-white">{voucher.code}</code><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span></div><h3 className="mt-3 text-base font-black text-slate-950">{voucher.title_ar}</h3><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{voucher.description_ar || 'بدون وصف إضافي.'}</p></div>
                        <div className="text-left"><p className="text-2xl font-black text-violet-700">{discountLabel(voucher)}</p><p className="text-[10px] font-bold text-slate-400">{voucher.discount_target === 'delivery_fee' ? 'من التوصيل' : 'من المنتجات'}</p></div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">الحد الأدنى</p><p className="mt-1 font-black text-slate-800">{money(voucher.minimum_subtotal)}</p></div>
                        <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">مرات الاستخدام</p><p className="mt-1 font-black text-slate-800">{redeemed.toLocaleString('ar-EG')}{voucher.max_redemptions_total ? ` / ${voucher.max_redemptions_total.toLocaleString('ar-EG')}` : ''}</p></div>
                        <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">النطاق</p><p className="mt-1 truncate font-black text-slate-800">{linkedStore?.name_ar || linkedCategory?.name_ar || 'كل المتاجر'}</p></div>
                        <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">خصومات مصروفة</p><p className="mt-1 font-black text-slate-800">{money(discountSpent)}</p></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-500"><span className="rounded-lg bg-sky-50 px-2 py-1 text-sky-700">{reserved.toLocaleString('ar-EG')} محجوز</span>{voucher.first_order_only ? <span className="rounded-lg bg-violet-50 px-2 py-1 text-violet-700">أول طلب فقط</span> : null}<span className="rounded-lg bg-slate-100 px-2 py-1">لكل عميل: {(voucher.max_redemptions_per_user ?? 1).toLocaleString('ar-EG')}</span></div>
                      <div className="mt-4 text-[10px] font-bold leading-5 text-slate-400">{voucher.starts_at ? `من ${formatDate(voucher.starts_at)}` : 'يبدأ فورًا'} · {voucher.ends_at ? `حتى ${formatDate(voucher.ends_at)}` : 'بدون تاريخ نهاية'}</div>
                      <div className="mt-5 flex gap-2">
                        <details className="group flex-1 rounded-xl border border-slate-200">
                          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-violet-700">تعديل <ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
                          <div className="border-t border-slate-200 p-4">
                            <form action={updateMarketingVoucher} className="space-y-3">
                              <input type="hidden" name="id" value={voucher.id} />
                              <div className="grid gap-3 md:grid-cols-2">
                                <label className={labelClass}>الكود<input name="code" required dir="ltr" defaultValue={voucher.code} className={inputClass} /></label>
                                <label className={labelClass}>الاسم<input name="title_ar" required defaultValue={voucher.title_ar} className={inputClass} /></label>
                                <label className={labelClass}>النوع<select name="discount_type" defaultValue={voucher.discount_type} className={inputClass}><option value="percentage">نسبة</option><option value="fixed">مبلغ ثابت</option></select></label>
                                <label className={labelClass}>القيمة<input name="discount_value" type="number" min="0.01" step="0.01" defaultValue={String(voucher.discount_value)} className={inputClass} /></label>
                                <label className={labelClass}>الخصم على<select name="discount_target" defaultValue={voucher.discount_target} className={inputClass}><option value="order_subtotal">المنتجات</option><option value="delivery_fee">التوصيل</option></select></label>
                                <label className={labelClass}>أقصى خصم<input name="max_discount_amount" type="number" min="0.01" step="0.01" defaultValue={voucher.max_discount_amount == null ? '' : String(voucher.max_discount_amount)} className={inputClass} /></label>
                                <label className={labelClass}>الحد الأدنى<input name="minimum_subtotal" type="number" min="0" step="0.01" defaultValue={String(voucher.minimum_subtotal)} className={inputClass} /></label>
                                <label className={labelClass}>المتجر<select name="store_id" defaultValue={voucher.store_id ?? ''} className={inputClass}><option value="">كل المتاجر</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name_ar}</option>)}</select></label>
                                <label className={labelClass}>الفئة<select name="category_id" defaultValue={voucher.category_id ?? ''} className={inputClass}><option value="">كل الفئات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}</select></label>
                                <label className={labelClass}>البداية<input name="starts_at" type="datetime-local" defaultValue={localDateTimeValue(voucher.starts_at)} className={inputClass} /></label>
                                <label className={labelClass}>النهاية<input name="ends_at" type="datetime-local" defaultValue={localDateTimeValue(voucher.ends_at)} className={inputClass} /></label>
                                <label className={labelClass}>إجمالي الاستخدام<input name="max_redemptions_total" type="number" min="1" defaultValue={voucher.max_redemptions_total ?? ''} className={inputClass} /></label>
                                <label className={labelClass}>لكل عميل<input name="max_redemptions_per_user" type="number" min="1" defaultValue={voucher.max_redemptions_per_user ?? 1} className={inputClass} /></label>
                                <label className={`${labelClass} md:col-span-2`}>الوصف<textarea name="description_ar" defaultValue={voucher.description_ar ?? ''} className={textareaClass} /></label>
                              </div>
                              <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-xs font-black text-slate-700"><input name="first_order_only" type="checkbox" defaultChecked={voucher.first_order_only} className="h-4 w-4 accent-violet-600" /> أول طلب فقط</label><label className="flex items-center gap-2 text-xs font-black text-emerald-700"><input name="is_active" type="checkbox" defaultChecked={voucher.is_active} className="h-4 w-4 accent-emerald-600" /> مفعّل</label></div>
                              <button className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">حفظ التعديلات</button>
                            </form>
                          </div>
                        </details>
                        <form action={toggleMarketingVoucher}><input type="hidden" name="id" value={voucher.id} /><input type="hidden" name="next_active" value={voucher.is_active ? 'false' : 'true'} /><button className={`rounded-xl px-4 py-2.5 text-xs font-black ${voucher.is_active ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'bg-emerald-600 text-white'}`}>{voucher.is_active ? 'إيقاف' : 'تشغيل'}</button></form>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <EmptyPanel title="لا توجد كوبونات" description="أنشئ أول كوبون من النموذج الموجود بالأعلى." />}
          </section>
        </div>
      ) : null}

      {tab === 'usage' ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">استخدامات الكوبونات</h2><p className="mt-1 text-xs font-semibold text-slate-500">سجل للمتابعة فقط؛ لا نعدل الاستخدامات يدويًا لأنها مرتبطة بالطلبات.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{redemptions.length.toLocaleString('ar-EG')} سجل</span></div>
          {redemptions.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black text-slate-400 md:grid"><span>الكوبون</span><span>العميل</span><span>الخصم</span><span>الحالة</span><span>الوقت</span></div>
              <div className="divide-y divide-slate-100">
                {redemptions.slice(0, 100).map((redemption) => {
                  const voucher = vouchers.find((item) => item.id === redemption.voucher_id);
                  const statusLabel = redemption.status === 'redeemed' ? 'تم الصرف' : redemption.status === 'reserved' ? 'محجوز' : redemption.status === 'released' ? 'أُلغي الحجز' : redemption.status;
                  const statusClass = redemption.status === 'redeemed' ? 'bg-emerald-100 text-emerald-700' : redemption.status === 'reserved' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600';
                  return (
                    <div key={redemption.id} className="grid gap-2 px-4 py-4 text-xs md:grid-cols-[1fr_1.2fr_1fr_1fr_1fr] md:items-center md:gap-3">
                      <div><span className="md:hidden font-bold text-slate-400">الكوبون: </span><code dir="ltr" className="font-black text-slate-900">{voucher?.code || '—'}</code></div>
                      <div className="font-bold text-slate-600"><span className="md:hidden font-bold text-slate-400">العميل: </span>{redemption.customer_phone_snapshot}</div>
                      <div className="font-black text-slate-900"><span className="md:hidden font-bold text-slate-400">الخصم: </span>{money(redemption.discount_amount)}</div>
                      <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass}`}>{statusLabel}</span></div>
                      <div className="text-[11px] font-bold text-slate-500">{formatDate(redemption.redeemed_at || redemption.reserved_at || redemption.created_at)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyPanel title="لا توجد استخدامات" description="ستظهر هنا تلقائيًا عند استخدام العملاء للكوبونات." />}
        </section>
      ) : null}

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-500">أدوات متقدمة — جداول الربط والتفاصيل التقنية</summary>
        <div className="grid gap-2 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/now/data/home_banner_images" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><ImageIcon size={14} /> صور العروض الإضافية</Link>
          <Link href="/admin/now/data/home_banner_products" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><BadgePercent size={14} /> ربط منتجات العرض</Link>
          <Link href="/admin/now/data/home_banner_service_areas" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><Users size={14} /> مناطق ظهور العرض</Link>
          <Link href="/admin/now/data/voucher_categories" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><TicketPercent size={14} /> ربط فئات الكوبونات</Link>
        </div>
      </details>
    </div>
  );
}
