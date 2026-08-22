import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CircleDot,
  Layers3,
  Package2,
  Plus,
  Store,
} from 'lucide-react';

import { Notice, PageHeader, inputClass, labelClass, textareaClass } from '../../components/ui-kit';
import { createCatalogStore } from './actions';
import { getCatalogOverviewData } from './catalog-data';

export default async function CatalogStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { stores, storeCategories, cities } = await getCatalogOverviewData();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="المتاجر والمنتجات"
        title="اختار المتجر اللي عايز تديره"
        description="كل متجر ظاهر بصورته وحالته وعدد منتجاته. افتح أي متجر لإدارة المنتجات ومواعيد العمل من مكان واحد."
        icon={<Store size={16} />}
        actions={(
          <a
            href="#add-store"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus size={17} />
            إضافة متجر جديد
          </a>
        )}
      />

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">المتاجر</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{stores.length.toLocaleString('ar-EG')} متجر</p>
          </div>
        </div>

        {stores.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => {
              const heroImage = store.cover_image_url || store.logo_url;
              return (
                <Link
                  key={store.id}
                  href={`/admin/now/sections/catalog/${store.id}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-50 via-slate-50 to-white">
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={store.name_ar}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-violet-300">
                        <Store size={48} strokeWidth={1.7} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black backdrop-blur ${store.is_active ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/85 text-white'}`}>
                        {store.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                      {store.is_manually_closed ? (
                        <span className="rounded-full bg-rose-500/90 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">مغلق يدويًا</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700">{store.categoryName}</span>
                        <h3 className="mt-2 truncate text-lg font-black text-slate-950">{store.name_ar}</h3>
                        <p className="mt-1 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-500">
                          {store.short_description_ar || 'اضغط لفتح إدارة المتجر.'}
                        </p>
                      </div>
                      {store.logo_url ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <Image src={store.logo_url} alt="" fill sizes="56px" className="object-cover" />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-500"><Package2 size={14} /><span className="text-[11px] font-black">المنتجات</span></div>
                        <p className="mt-1 text-lg font-black text-slate-950">{store.productCount.toLocaleString('ar-EG')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-500"><Layers3 size={14} /><span className="text-[11px] font-black">الفئات</span></div>
                        <p className="mt-1 text-lg font-black text-slate-950">{store.categoryCount.toLocaleString('ar-EG')}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500"><CircleDot size={13} /> إدارة المنتجات والمواعيد</span>
                      <span className="flex items-center gap-1 text-xs font-black text-violet-700">فتح المتجر <ArrowLeft size={14} className="transition group-hover:-translate-x-1" /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Store className="mx-auto text-slate-300" size={42} />
            <p className="mt-3 font-black text-slate-700">مفيش متاجر مضافة لسه</p>
            <a href="#add-store" className="mt-3 inline-flex text-sm font-black text-violet-700">أضف أول متجر</a>
          </div>
        )}
      </section>

      <section id="add-store" className="scroll-mt-6 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Plus size={20} /></span>
          <div>
            <h2 className="text-lg font-black text-slate-950">إضافة متجر جديد</h2>
            <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">أدخل البيانات الأساسية وارفع صور المتجر. بعد الإنشاء هتدخل مباشرة لإضافة المنتجات وضبط المواعيد.</p>
          </div>
        </div>

        <form action={createCatalogStore} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClass}>
              اسم المتجر بالعربية *
              <input name="name_ar" required className={inputClass} placeholder="مثال: فريكة" />
            </label>
            <label className={labelClass}>
              اسم المتجر بالإنجليزية
              <input name="name_en" className={inputClass} placeholder="Freeka" dir="ltr" />
            </label>
            <label className={labelClass}>
              فئة المتجر *
              <select name="category_id" required className={inputClass} defaultValue="">
                <option value="" disabled>اختر الفئة...</option>
                {storeCategories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              المدينة *
              <select name="city_id" required className={inputClass} defaultValue="">
                <option value="" disabled>اختر المدينة...</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name_ar}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              رقم الهاتف
              <input name="phone" type="tel" className={inputClass} dir="ltr" />
            </label>
            <label className={labelClass}>
              رقم واتساب
              <input name="whatsapp_number" type="tel" className={inputClass} dir="ltr" />
            </label>
            <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
              وصف مختصر
              <textarea name="short_description_ar" className={textareaClass} placeholder="وصف يظهر لفريق التشغيل والعميل حسب استخدامه في التطبيق." />
            </label>
            <label className={labelClass}>
              لوجو المتجر
              <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} />
              <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">JPG / PNG / WEBP — بحد أقصى 10MB</span>
            </label>
            <label className={labelClass}>
              صورة غلاف المتجر
              <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} />
            </label>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700">
              <Plus size={17} /> إنشاء المتجر
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
