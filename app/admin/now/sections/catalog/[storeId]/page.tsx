import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Clock3,
  Layers3,
  Package2,
  Plus,
  Store,
} from 'lucide-react';

import { Notice, PageHeader, inputClass, labelClass, textareaClass } from '../../../components/ui-kit';
import {
  createCatalogCategory,
  createCatalogProduct,
  updateCatalogStoreHours,
} from '../actions';
import { getCatalogStoreData } from '../catalog-data';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function money(value: number | string) {
  return `${Number(value).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
}

function timeValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : '';
}

export default async function CatalogStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
}) {
  const { storeId } = await params;
  const query = await searchParams;
  const data = await getCatalogStoreData(storeId);
  if (!data) notFound();

  const { store, categories, products, hours } = data;
  const tab = query.tab === 'hours' ? 'hours' : 'products';
  const hoursMap = new Map(hours.map((hour) => [Number(hour.day_of_week), hour]));
  const storeHero = store.cover_image_url || store.logo_url;

  return (
    <div className="space-y-6">
      <Link href="/admin/now/sections/catalog" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-violet-700">
        <ArrowRight size={15} /> الرجوع لكل المتاجر
      </Link>

      <PageHeader
        eyebrow={store.categoryName}
        title={store.name_ar}
        description="إدارة منتجات المتجر ومواعيد العمل من نفس المكان."
        icon={<Store size={16} />}
        actions={(
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ${store.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {store.is_active ? 'المتجر نشط' : 'المتجر غير نشط'}
            </span>
            {store.is_manually_closed ? <span className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700">مغلق يدويًا</span> : null}
          </div>
        )}
      />

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative min-h-44 bg-gradient-to-br from-violet-50 to-slate-100 md:min-h-full">
            {storeHero ? <Image src={storeHero} alt={store.name_ar} fill sizes="220px" className="object-cover" /> : <div className="flex h-full min-h-44 items-center justify-center text-violet-300"><Store size={52} /></div>}
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-violet-700">{store.categoryName}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{store.name_ar}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{store.short_description_ar || 'لا يوجد وصف مختصر للمتجر.'}</p>
              </div>
              {store.logo_url ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <Image src={store.logo_url} alt="" fill sizes="64px" className="object-cover" />
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">{products.length.toLocaleString('ar-EG')} منتج</span>
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">{categories.length.toLocaleString('ar-EG')} فئة</span>
            </div>
          </div>
        </div>
      </section>

      <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <Link
          href={`/admin/now/sections/catalog/${storeId}?tab=products`}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'products' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Package2 size={17} /> المنتجات
        </Link>
        <Link
          href={`/admin/now/sections/catalog/${storeId}?tab=hours`}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'hours' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <CalendarClock size={17} /> مواعيد المتجر
        </Link>
      </nav>

      {tab === 'products' ? (
        <div className="space-y-6">
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">منتجات {store.name_ar}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">اضغط على أي منتج لتعديل السعر أو الصورة أو التوفر أو حذفه.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="#add-category" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"><Layers3 size={15} /> إضافة فئة</a>
                <a href="#add-product" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-violet-200 hover:bg-violet-700"><Plus size={15} /> إضافة منتج</a>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/now/sections/catalog/${storeId}/products/${product.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                      {product.displayImageUrl ? (
                        <Image src={product.displayImageUrl} alt={product.name_ar} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><Package2 size={44} /></div>
                      )}
                      <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm ${product.is_available && product.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {product.is_available && product.is_active ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="inline-flex max-w-full truncate rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">{product.categoryName}</span>
                      <h3 className="mt-2 truncate text-sm font-black text-slate-950">{product.name_ar}</h3>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-950">{money(product.base_price)}</p>
                          {product.compare_at_price ? <p className="text-[11px] font-bold text-slate-400 line-through">{money(product.compare_at_price)}</p> : null}
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-black text-violet-700">تعديل <ArrowLeft size={13} /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Package2 className="mx-auto text-slate-300" size={42} />
                <p className="mt-3 font-black text-slate-700">مفيش منتجات في المتجر لسه</p>
                <a href="#add-product" className="mt-2 inline-flex text-sm font-black text-violet-700">أضف أول منتج</a>
              </div>
            )}
          </section>

          <section id="add-product" className="scroll-mt-6 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Plus size={19} /></span>
              <div>
                <h2 className="font-black text-slate-950">إضافة منتج جديد</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">لازم تختار فئة من فئات نفس المتجر.</p>
              </div>
            </div>

            {categories.length > 0 ? (
              <form action={createCatalogProduct} className="mt-5 space-y-5">
                <input type="hidden" name="store_id" value={storeId} />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className={labelClass}>اسم المنتج بالعربية *<input name="name_ar" required className={inputClass} /></label>
                  <label className={labelClass}>اسم المنتج بالإنجليزية<input name="name_en" className={inputClass} dir="ltr" /></label>
                  <label className={labelClass}>
                    فئة المنتج *
                    <select name="catalog_category_id" required className={inputClass} defaultValue="">
                      <option value="" disabled>اختر الفئة...</option>
                      {categories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>السعر *<input name="base_price" type="number" min="0" step="0.01" required className={inputClass} /></label>
                  <label className={labelClass}>السعر قبل الخصم<input name="compare_at_price" type="number" min="0" step="0.01" className={inputClass} /></label>
                  <label className={labelClass}>صورة المنتج<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} /></label>
                  <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>وصف المنتج<textarea name="description_ar" className={textareaClass} /></label>
                </div>
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-700"><Plus size={16} /> إضافة المنتج</button>
                </div>
              </form>
            ) : (
              <Notice tone="warning" title="أضف فئة أولًا">لا يمكن إنشاء منتج بدون ربطه بفئة داخل المتجر.</Notice>
            )}
          </section>

          <section id="add-category" className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Layers3 size={19} /></span>
              <div>
                <h2 className="font-black text-slate-950">إضافة فئة للمتجر</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">الفئة الجديدة هتظهر فورًا في قائمة اختيار فئة المنتج.</p>
              </div>
            </div>
            <form action={createCatalogCategory} className="mt-5 space-y-5">
              <input type="hidden" name="store_id" value={storeId} />
              <div className="grid gap-4 md:grid-cols-3">
                <label className={labelClass}>اسم الفئة بالعربية *<input name="name_ar" required className={inputClass} /></label>
                <label className={labelClass}>اسم الفئة بالإنجليزية<input name="name_en" className={inputClass} dir="ltr" /></label>
                <label className={labelClass}>صورة الفئة<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} /></label>
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"><Plus size={16} /> إضافة الفئة</button>
              </div>
            </form>
          </section>
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Clock3 size={19} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">مواعيد فتح وإغلاق المتجر</h2>
              <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">فعّل اليوم وحدد وقت الفتح والإغلاق. الأيام غير المفعلة تعتبر إجازة.</p>
            </div>
          </div>

          {store.is_manually_closed ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-6 text-rose-800">المتجر مغلق يدويًا حاليًا؛ تعديل المواعيد لن يفتحه إلا بعد إلغاء الإغلاق اليدوي من بيانات المتجر.</div>
          ) : null}

          <form action={updateCatalogStoreHours} className="mt-6 space-y-3">
            <input type="hidden" name="store_id" value={storeId} />
            {DAYS.map((dayName, day) => {
              const hour = hoursMap.get(day);
              return (
                <div key={day} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[1fr_160px_160px] md:items-end">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                    <input type="checkbox" name={`is_open_${day}`} defaultChecked={hour?.is_open ?? false} className="h-5 w-5 accent-violet-600" />
                    <span>
                      <span className="block text-sm font-black text-slate-900">{dayName}</span>
                      <span className="text-[11px] font-semibold text-slate-400">فعّل لو المتجر يعمل في هذا اليوم</span>
                    </span>
                  </label>
                  <label className={labelClass}>وقت الفتح<input type="time" name={`open_time_${day}`} defaultValue={timeValue(hour?.open_time)} className={inputClass} /></label>
                  <label className={labelClass}>وقت الإغلاق<input type="time" name={`close_time_${day}`} defaultValue={timeValue(hour?.close_time)} className={inputClass} /></label>
                </div>
              );
            })}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 hover:bg-violet-700"><Clock3 size={16} /> حفظ مواعيد المتجر</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
