import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('[power-bank-inspect] Supabase admin env is unavailable in this deployment.');
  process.exit(0);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [storeCategoriesResult, storesResult, categoriesResult, productsResult] = await Promise.all([
  admin.schema('now').from('store_categories').select('id,slug,name_ar,name_en').order('sort_order'),
  admin.schema('now').from('stores').select('id,category_id,slug,name_ar,name_en,is_active').order('sort_order'),
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').order('store_id').order('sort_order'),
  admin.schema('now').from('products').select('id,store_id,catalog_category_id,name_ar,name_en,base_price,is_active').order('created_at', { ascending: false }).limit(2000),
]);

const error = storeCategoriesResult.error || storesResult.error || categoriesResult.error || productsResult.error;
if (error) {
  console.error('[power-bank-inspect] Database query failed:', error.message);
  process.exit(1);
}

const storeCategories = storeCategoriesResult.data ?? [];
const stores = storesResult.data ?? [];
const categories = categoriesResult.data ?? [];
const products = productsResult.data ?? [];
const storeCategoryById = new Map(storeCategories.map((row) => [row.id, row]));

const candidateStores = stores
  .map((store) => ({ ...store, store_category: storeCategoryById.get(store.category_id) ?? null }))
  .filter((store) => {
    const value = [store.slug, store.name_ar, store.name_en, store.store_category?.slug, store.store_category?.name_ar, store.store_category?.name_en]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return value.includes('book') || value.includes('مكتب');
  });

const candidateStoreIds = new Set(candidateStores.map((store) => store.id));
const bookstoreCategories = categories
  .filter((category) => candidateStoreIds.has(category.store_id))
  .map((category) => {
    const matching = products.filter((product) => product.catalog_category_id === category.id);
    return {
      ...category,
      product_count: matching.length,
      samples: matching.slice(0, 5).map((product) => ({
        name_ar: product.name_ar,
        name_en: product.name_en,
        base_price: product.base_price,
      })),
    };
  });

console.log('[power-bank-inspect] ' + JSON.stringify({ candidateStores, bookstoreCategories }));
