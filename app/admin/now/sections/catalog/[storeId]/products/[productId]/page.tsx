import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  ImagePlus,
  Layers3,
  Package2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

import { Notice, PageHeader, inputClass, labelClass, textareaClass } from '../../../../../components/ui-kit';
import { deleteCatalogProduct, updateCatalogProduct } from '../../../actions';
import { getCatalogProductEditor } from '../../../catalog-data';
import {
  createCatalogProductVariant,
  deleteCatalogProductVariant,
  updateCatalogProductVariant,
} from '../../../variant-actions';
import { getCatalogProductVariants } from '../../../variant-data';

function inputNumberValue(value: number | string | null) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatMoney(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ج.م`;
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(amount)} ج.م`;
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

  const variants = await getCatalogProductVariants(productId);
  const { store, product, categories } = data;
  const currentCategory = categories.find((category) => category.id === product.catalog_category_id);
  const hasVariants = variants.length > 0;
  const defaultVariant = variants.find((variant) => variant.is_default && variant.is_active) ?? null;

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
        description={hasVariants
          ? `المنتج لديه ${variants.length} أحجام/اختيارات. عدّل بيانات المنتج أو أسعار كل حجم من الأقسام بالأسفل.`
          : 'عدّل السعر أو الصورة أو الفئة أو التوفر، ويمكنك إضافة أحجام وأسعار مختلفة بالأسفل.'}
        icon={<Package2 size={16} />}
        actions={(
          <div className="flex flex-wrap gap-2">
            {hasVariants ? (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                {variants.length} أحجام / أسعار
              </span>
            ) : null}
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

          {hasVariants ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-amber-900">
                <Layers3 size={17} />
                <p className="text-sm font-black">المنتج له أسعار حسب الحجم</p>
              </div>
              <p className="mt-2 text-xs font-semibold leading-6 text-amber-800">
                السعر الأساسي للمنتج بيتزامن تلقائيًا مع الحجم الافتراضي عند تعديل الأحجام.
              </p>
              {defaultVariant ? (
                <div className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold text-amber-950">
                  الافتراضي حاليًا: <strong>{defaultVariant.name_ar}</strong> — {formatMoney(defaultVariant.price)}
                </div>
              ) : null}
            </div>
          ) : null}
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

            {hasVariants ? (
              <>
                <input type="hidden" name="base_price" value={inputNumberValue(product.base_price)} />
                <input type="hidden" name="compare_at_price" value={inputNumberValue(product.compare_at_price)} />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                  <p className="text-xs font-black text-amber-900">السعر يُدار من الأحجام</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-700">
                    بدل تعديل سعر واحد للمنتج، استخدم قسم «الأحجام والأسعار» بالأسفل. السعر الأساسي الحالي: {formatMoney(product.base_price)}.
                  </p>
                </div>
              </>
            ) : (
              <>
                <label className={labelClass}>
                  السعر *
                  <input name="base_price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(product.base_price)} required className={inputClass} />
                </label>
                <label className={labelClass}>
                  السعر قبل الخصم
                  <input name="compare_at_price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(product.compare_at_price)} className={inputClass} />
                  <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">اتركه فارغًا لو مفيش سعر قديم.</span>
                </label>
              </>
            )}

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
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-500">اقفلها مؤقتًا لو المنتج كله غير متاح.</span>
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
              <Save size={16} /> حفظ بيانات المنتج
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Layers3 size={19} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">الأحجام والأسعار</h2>
              <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">
                أضف سعر مختلف لكل حجم أو اختيار، وحدد واحدًا كافتراضي ليظهر كسعر المنتج الأساسي.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
            {variants.length} {variants.length === 1 ? 'اختيار' : 'اختيارات'}
          </span>
        </div>

        {variants.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {variants.map((variant) => (
              <article key={variant.id} className={`rounded-3xl border p-4 sm:p-5 ${variant.is_default && variant.is_active ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/40'}`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-950">{variant.name_ar}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">{formatMoney(variant.price)}</span>
                    {variant.is_default && variant.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">
                        <BadgeCheck size={13} /> الافتراضي
                      </span>
                    ) : null}
                    {!variant.is_active ? <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-black text-slate-600">مخفي</span> : null}
                    {variant.is_active && !variant.is_available ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black text-rose-700">غير متوفر</span> : null}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">ترتيب #{variant.sort_order}</span>
                </div>

                <form action={updateCatalogProductVariant}>
                  <input type="hidden" name="store_id" value={storeId} />
                  <input type="hidden" name="product_id" value={productId} />
                  <input type="hidden" name="variant_id" value={variant.id} />

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className={labelClass}>
                      اسم الحجم بالعربية *
                      <input name="name_ar" defaultValue={variant.name_ar} required className={inputClass} />
                    </label>
                    <label className={labelClass}>
                      الاسم بالإنجليزية
                      <input name="name_en" defaultValue={variant.name_en ?? ''} className={inputClass} dir="ltr" />
                    </label>
                    <label className={labelClass}>
                      السعر *
                      <input name="price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(variant.price)} required className={inputClass} />
                    </label>
                    <label className={labelClass}>
                      السعر قبل الخصم
                      <input name="compare_at_price" type="number" min="0" step="0.01" defaultValue={inputNumberValue(variant.compare_at_price)} className={inputClass} />
                    </label>
                    <label className={labelClass}>
                      SKU
                      <input name="sku" defaultValue={variant.sku ?? ''} className={inputClass} dir="ltr" />
                    </label>
                    <label className={labelClass}>
                      Barcode
                      <input name="barcode" defaultValue={variant.barcode ?? ''} className={inputClass} dir="ltr" />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <span>
                        <span className="block text-xs font-black text-slate-800">الحجم الافتراضي</span>
                        <span className="mt-1 block text-[10px] font-semibold text-slate-400">سعره يصبح السعر الأساسي</span>
                      </span>
                      <input type="checkbox" name="is_default" defaultChecked={variant.is_default} className="h-5 w-5 accent-amber-500" />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-800">متوفر حاليًا</span>
                      <input type="checkbox" name="is_available" defaultChecked={variant.is_available} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-800">ظاهر للعميل</span>
                      <input type="checkbox" name="is_active" defaultChecked={variant.is_active} className="h-5 w-5 accent-violet-600" />
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
                      <Save size={14} /> حفظ الحجم
                    </button>
                  </div>
                </form>

                <details className="mt-3 border-t border-slate-200 pt-3">
                  <summary className="cursor-pointer list-none text-[11px] font-black text-rose-600">حذف هذا الحجم</summary>
                  <form action={deleteCatalogProductVariant} className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-3">
                    <input type="hidden" name="store_id" value={storeId} />
                    <input type="hidden" name="product_id" value={productId} />
                    <input type="hidden" name="variant_id" value={variant.id} />
                    <p className="text-[11px] font-bold leading-5 text-rose-800">سيتم حذف «{variant.name_ar}». لو كان افتراضيًا سيتم اختيار حجم متاح آخر تلقائيًا.</p>
                    <button type="submit" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-black text-white hover:bg-rose-700">
                      <Trash2 size={13} /> حذف
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <Layers3 size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">المنتج حاليًا له سعر واحد فقط</p>
            <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">أضف أول حجم لو المنتج له صغير / وسط / كبير أو أي اختيارات بأسعار مختلفة.</p>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Plus size={16} /></span>
            <div>
              <h3 className="text-sm font-black text-slate-900">إضافة حجم أو سعر جديد</h3>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">مثال: صغير 119 ج.م، كبير 179 ج.م، كبير جدًا 239 ج.م.</p>
            </div>
          </div>

          <form action={createCatalogProductVariant}>
            <input type="hidden" name="store_id" value={storeId} />
            <input type="hidden" name="product_id" value={productId} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className={labelClass}>
                اسم الحجم بالعربية *
                <input name="name_ar" required placeholder="مثال: كبير" className={inputClass} />
              </label>
              <label className={labelClass}>
                الاسم بالإنجليزية
                <input name="name_en" placeholder="Large" className={inputClass} dir="ltr" />
              </label>
              <label className={labelClass}>
                السعر *
                <input name="price" type="number" min="0" step="0.01" required placeholder="179" className={inputClass} />
              </label>
              <label className={labelClass}>
                السعر قبل الخصم
                <input name="compare_at_price" type="number" min="0" step="0.01" className={inputClass} />
              </label>
              <label className={labelClass}>
                SKU
                <input name="sku" className={inputClass} dir="ltr" />
              </label>
              <label className={labelClass}>
                Barcode
                <input name="barcode" className={inputClass} dir="ltr" />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-3">
                <span>
                  <span className="block text-xs font-black text-slate-800">اجعله الافتراضي</span>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">أول حجم نشط يصبح افتراضيًا تلقائيًا</span>
                </span>
                <input type="checkbox" name="is_default" className="h-5 w-5 accent-amber-500" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-3">
                <span className="text-xs font-black text-slate-800">متوفر حاليًا</span>
                <input type="checkbox" name="is_available" defaultChecked className="h-5 w-5 accent-violet-600" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-3">
                <span className="text-xs font-black text-slate-800">ظاهر للعميل</span>
                <input type="checkbox" name="is_active" defaultChecked className="h-5 w-5 accent-violet-600" />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700">
                <Plus size={16} /> إضافة الحجم
              </button>
            </div>
          </form>
        </div>
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
