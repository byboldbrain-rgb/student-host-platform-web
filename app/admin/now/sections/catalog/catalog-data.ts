import 'server-only';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../../lib/table-data';

type StoreRow = {
  id: string;
  category_id: string;
  city_id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  short_description_ar: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  is_manually_closed: boolean;
  sort_order: number;
};

type StoreCategoryRow = {
  id: string;
  slug: string;
  name_ar: string;
};

type CityRow = {
  id: string;
  name_ar: string;
};

type CatalogCategoryRow = {
  id: string;
  store_id: string;
  parent_id: string | null;
  name_ar: string;
  name_en: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type ProductRow = {
  id: string;
  store_id: string;
  catalog_category_id: string;
  product_type: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
};

type ProductImageRow = {
  product_id: string;
  image_url: string;
  is_cover: boolean;
  is_active: boolean;
  sort_order: number;
};

type BusinessHourRow = {
  id: string;
  store_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

function errorMessage(error: { message?: string; details?: string } | null) {
  return [error?.message, error?.details].filter(Boolean).join(' — ') || 'تعذر تحميل البيانات.';
}

export type CatalogStoreCard = StoreRow & {
  categoryName: string;
  categorySlug: string;
  productCount: number;
  categoryCount: number;
};

export type CatalogCategory = CatalogCategoryRow;

export type CatalogProductCard = ProductRow & {
  categoryName: string;
  displayImageUrl: string | null;
};

export type StoreBusinessHour = BusinessHourRow;

export async function getCatalogOverviewData() {
  await requireNowTableAccess('stores');
  const admin = createAdminClient();

  const [storesResult, storeCategoriesResult, citiesResult, productsResult, catalogCategoriesResult] = await Promise.all([
    admin
      .schema('now')
      .from('stores')
      .select('id,category_id,city_id,slug,name_ar,name_en,short_description_ar,logo_url,cover_image_url,is_active,is_manually_closed,sort_order')
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
    admin.schema('now').from('store_categories').select('id,slug,name_ar').order('sort_order', { ascending: true }),
    admin.schema('now').from('cities').select('id,name_ar').eq('is_active', true).order('sort_order', { ascending: true }),
    admin.schema('now').from('products').select('store_id'),
    admin.schema('now').from('catalog_categories').select('store_id'),
  ]);

  for (const result of [storesResult, storeCategoriesResult, citiesResult, productsResult, catalogCategoriesResult]) {
    if (result.error) throw new Error(errorMessage(result.error));
  }

  const stores = (storesResult.data ?? []) as unknown as StoreRow[];
  const storeCategories = (storeCategoriesResult.data ?? []) as unknown as StoreCategoryRow[];
  const cities = (citiesResult.data ?? []) as unknown as CityRow[];
  const productStoreIds = (productsResult.data ?? []) as unknown as Array<{ store_id: string }>;
  const categoryStoreIds = (catalogCategoriesResult.data ?? []) as unknown as Array<{ store_id: string }>;

  const storeCategoryMap = new Map(storeCategories.map((category) => [category.id, category]));
  const productCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const product of productStoreIds) {
    productCounts.set(product.store_id, (productCounts.get(product.store_id) ?? 0) + 1);
  }
  for (const category of categoryStoreIds) {
    categoryCounts.set(category.store_id, (categoryCounts.get(category.store_id) ?? 0) + 1);
  }

  const cards: CatalogStoreCard[] = stores.map((store) => {
    const category = storeCategoryMap.get(store.category_id);
    return {
      ...store,
      categoryName: category?.name_ar ?? 'بدون فئة',
      categorySlug: category?.slug ?? '',
      productCount: productCounts.get(store.id) ?? 0,
      categoryCount: categoryCounts.get(store.id) ?? 0,
    };
  });

  return { stores: cards, storeCategories, cities };
}

export async function getCatalogStoreData(storeId: string) {
  await requireNowTableAccess('stores');
  const admin = createAdminClient();

  const storeResult = await admin
    .schema('now')
    .from('stores')
    .select('id,category_id,city_id,slug,name_ar,name_en,short_description_ar,logo_url,cover_image_url,is_active,is_manually_closed,sort_order')
    .eq('id', storeId)
    .maybeSingle();

  if (storeResult.error) throw new Error(errorMessage(storeResult.error));
  if (!storeResult.data) return null;

  const store = storeResult.data as unknown as StoreRow;
  const [storeCategoryResult, categoriesResult, productsResult, hoursResult] = await Promise.all([
    admin.schema('now').from('store_categories').select('id,slug,name_ar').eq('id', store.category_id).maybeSingle(),
    admin
      .schema('now')
      .from('catalog_categories')
      .select('id,store_id,parent_id,name_ar,name_en,image_url,is_active,sort_order')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
    admin
      .schema('now')
      .from('products')
      .select('id,store_id,catalog_category_id,product_type,name_ar,name_en,description_ar,base_price,compare_at_price,image_url,is_available,is_active,sort_order')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
    admin
      .schema('now')
      .from('store_business_hours')
      .select('id,store_id,day_of_week,is_open,open_time,close_time')
      .eq('store_id', storeId)
      .order('day_of_week', { ascending: true }),
  ]);

  for (const result of [storeCategoryResult, categoriesResult, productsResult, hoursResult]) {
    if (result.error) throw new Error(errorMessage(result.error));
  }

  const storeCategory = (storeCategoryResult.data ?? null) as unknown as StoreCategoryRow | null;
  const categories = (categoriesResult.data ?? []) as unknown as CatalogCategoryRow[];
  const products = (productsResult.data ?? []) as unknown as ProductRow[];
  const hours = (hoursResult.data ?? []) as unknown as BusinessHourRow[];
  const productIds = products.map((product) => product.id);

  let productImages: ProductImageRow[] = [];
  if (productIds.length > 0) {
    const imagesResult = await admin
      .schema('now')
      .from('product_images')
      .select('product_id,image_url,is_cover,is_active,sort_order')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('is_cover', { ascending: false })
      .order('sort_order', { ascending: true });
    if (imagesResult.error) throw new Error(errorMessage(imagesResult.error));
    productImages = (imagesResult.data ?? []) as unknown as ProductImageRow[];
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category.name_ar]));
  const coverMap = new Map<string, string>();
  for (const image of productImages) {
    if (!coverMap.has(image.product_id)) coverMap.set(image.product_id, image.image_url);
  }

  const productCards: CatalogProductCard[] = products.map((product) => ({
    ...product,
    categoryName: categoryMap.get(product.catalog_category_id) ?? 'بدون فئة',
    displayImageUrl: product.image_url || coverMap.get(product.id) || null,
  }));

  return {
    store: {
      ...store,
      categoryName: storeCategory?.name_ar ?? 'بدون فئة',
      categorySlug: storeCategory?.slug ?? '',
    },
    categories,
    products: productCards,
    hours,
  };
}

export async function getCatalogProductEditor(storeId: string, productId: string) {
  await requireNowTableAccess('products');
  const admin = createAdminClient();

  const [storeResult, productResult, categoriesResult] = await Promise.all([
    admin
      .schema('now')
      .from('stores')
      .select('id,category_id,city_id,slug,name_ar,name_en,short_description_ar,logo_url,cover_image_url,is_active,is_manually_closed,sort_order')
      .eq('id', storeId)
      .maybeSingle(),
    admin
      .schema('now')
      .from('products')
      .select('id,store_id,catalog_category_id,product_type,name_ar,name_en,description_ar,base_price,compare_at_price,image_url,is_available,is_active,sort_order')
      .eq('id', productId)
      .eq('store_id', storeId)
      .maybeSingle(),
    admin
      .schema('now')
      .from('catalog_categories')
      .select('id,store_id,parent_id,name_ar,name_en,image_url,is_active,sort_order')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
  ]);

  for (const result of [storeResult, productResult, categoriesResult]) {
    if (result.error) throw new Error(errorMessage(result.error));
  }
  if (!storeResult.data || !productResult.data) return null;

  const store = storeResult.data as unknown as StoreRow;
  const product = productResult.data as unknown as ProductRow;
  const categories = (categoriesResult.data ?? []) as unknown as CatalogCategoryRow[];

  const coverResult = await admin
    .schema('now')
    .from('product_images')
    .select('image_url')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('is_cover', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (coverResult.error) throw new Error(errorMessage(coverResult.error));

  return {
    store,
    product: {
      ...product,
      displayImageUrl: product.image_url || ((coverResult.data as { image_url?: string } | null)?.image_url ?? null),
    },
    categories,
  };
}
