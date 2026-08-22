import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  ImagePlus,
  Package2,
  Save,
  Trash2,
} from 'lucide-react';

import { Notice, PageHeader, inputClass, labelClass, textareaClass } from '../../../../../components/ui-kit';
import { deleteCatalogProduct, updateCatalogProduct } from '../../../actions';
import { getCatalogProductEditor } from '../../../catalog-data';

function inputNumberValue(value: number | string | null) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export default async function CatalogProductEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; productId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { storeId, productId } = await params;
  const query = await searchParams;
  const data = await getCatalogProductEditor(storeId, productId);
  if (!data) notFound();

  const { store, product, categories } = data;
  const currentCategory = categories.find((category) => category.id === product.catalog_category_id);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/now/sections/catalog/${storeId}?tab=products`}
        className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-violet-700"
      >
        <ArrowRight size={15} /> الرجوع لمنتجات {store.name_ar}
      </Link>

      <PageHeader
        eyebrow={currentCategory?.name_ar || 'منتج'}
        title={product.name_ar}
        description="عدّل السعر أو الصورة أو الفئة أو التوفر، ثم احفظ التغييرات."
        icon={<Package2 size={16} />}
        actions={(
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ${product.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
              {product.is_available ? 'متوفر حاليًا' : 'غير متوفر'}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ${product.is_active ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'}`}>
              {product.is_active ? 'ظاهر في الكتالوج' : 'مخفي'}
            </span>
          </div>
        )}
      />

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50">
              {product.displayImageUrl ? (
                <Image src={product.displayImageUrl} alt={product.name_ar} fill sizes="320px" className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-300">
                  <Package2 size={50} />
                  <span className="mt-2 text-xs font-black">لا توجد صورة</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[11px] font-black text-slate-400">الصورة الحالية</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">رفع صورة جديدة من النموذج هيستبدل صورة الغلاف الحالية للمنتج.</p>
            </div>
          </div>
        </div>

        <form action={updateCatalogProduct} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <input type="hidden" name="store_id" value={storeId} />
          <input type="hidden" name="product_id" value={productId} />

          <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Package2 size={19} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">بيانات المنتج</h2>
              <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">أي منتج لازم يفضل مربوط بفئة داخل نفس المتجر.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClass}>
              اسم المنتج بالعربية *
              <input name="name_ar" defaultValue={product.name_ar} required className={inputClass} />
            </label>
            <label className={labelClass}>
              اسم المنتج بالإنجليزية
              <input name="name_en" defaultValue={product.name_en ?? ''} className={inputClass} dir="ltr" />
            </label>
            <label className={labelClass}>
              فئة المنتج *
              <select name="catalog_category_id" defaultValue={product.catalog_category_id} required className={inputClass}>
                {categories.filter((category) => category.is_active || category.id === product.catalog_category_id).map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}{category.is_active ? '' : ' — غير نشطة'}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              السعر *
              <input name="base_price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(product.base_price)} required className={inputClass} />
            </label>
            <label className={labelClass}>
              السعر قبل الخصم
              <input name="compare_at_price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(product.compare_at_price)} className={inputClass} />
              <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">اتركه فارغًا لو مفيش سعر قديم.</span>
            </label>
            <label className={labelClass}>
              تغيير صورة المنتج
              <span className={`${inputClass} flex h-auto min-h-11 items-center gap-2 py-2`}>
                <ImagePlus size={16} className="shrink-0 text-violet-600" />
                <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="min-w-0 flex-1 text-xs" />
              </span>
              <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">JPG / PNG / WEBP — بحد أقصى 10MB</span>
            </label>
            <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
              وصف المنتج
              <textarea name="description_ar" defaultValue={product.description_ar ?? ''} className={textareaClass} />
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-violet-200">
              <span>
                <span className="block text-sm font-black text-slate-800">متوفر حاليًا</span>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-500">اقفلها مؤقتًا لو المنتج خلص من المخزون.</span>
              </span>
              <input type="checkbox" name="is_available" defaultChecked={product.is_available} className="mt-1 h-5 w-5 accent-violet-600" />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-violet-200">
              <span>
                <span className="block text-sm font-black text-slate-800">ظاهر في الكتالوج</span>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-500">اقفلها لو عايز تخفي المنتج بدون حذفه.</span>
              </span>
              <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="mt-1 h-5 w-5 accent-violet-600" />
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700">
              <Save size={16} /> حفظ التعديلات
            </button>
          </div>
        </form>
      </section>

      <details className="rounded-3xl border border-rose-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-5 text-sm font-black text-rose-700">
          <Trash2 size={17} /> حذف المنتج نهائيًا
        </summary>
        <div className="border-t border-rose-100 p-5">
          <Notice tone="warning" title="الحذف نهائي">
            سيتم حذف المنتج وصوره ومتغيراته من الكتالوج. عناصر الطلبات القديمة تحتفظ بالـsnapshot الخاص بها لكن لن تظل مرتبطة بالمنتج المحذوف.
          </Notice>
          <form action={deleteCatalogProduct} className="mt-4 space-y-4">
            <input type="hidden" name="store_id" value={storeId} />
            <input type="hidden" name="product_id" value={productId} />
            <label className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-6 text-rose-900">
              <input type="checkbox" name="confirm_delete" value="yes" required className="mt-1 h-5 w-5 shrink-0 accent-rose-600" />
              <span>أنا متأكد إني عايز أحذف <strong>{product.name_ar}</strong> نهائيًا.</span>
            </label>
            <div className="flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-rose-700">
                <Trash2 size={16} /> حذف المنتج
              </button>
            </div>
          </form>
        </div>
      </details>
    </div>
  );
}
