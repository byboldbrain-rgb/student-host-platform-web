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

const [storeCategoriesResult, storesResult, categoriesResult] = await Promise.all([
  admin.schema('now').from('store_categories').select('id,slug,name_ar,name_en').order('sort_order'),
  admin.schema('now').from('stores').select('id,category_id,slug,name_ar,name_en,is_active').order('sort_order'),
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').order('sort_order'),
]);

const error = storeCategoriesResult.error || storesResult.error || categoriesResult.error;
if (error) {
  console.error('[power-bank-inspect] Database query failed:', error.message);
  process.exit(1);
}

const storeCategories = storeCategoriesResult.data ?? [];
const stores = storesResult.data ?? [];
const categories = categoriesResult.data ?? [];
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
const candidateCategories = categories.filter((category) => {
  if (!candidateStoreIds.has(category.store_id)) return false;
  const value = [category.slug, category.name_ar, category.name_en].filter(Boolean).join(' ').toLowerCase();
  return value.includes('mobile') || value.includes('access') || value.includes('power') || value.includes('اكسس') || value.includes('إكسس') || value.includes('موبايل') || value.includes('باور');
});

console.log('[power-bank-inspect] ' + JSON.stringify({ candidateStores, candidateCategories }));
