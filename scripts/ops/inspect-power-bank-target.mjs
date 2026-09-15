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

const [storesResult, categoriesResult, productsResult] = await Promise.all([
  admin.schema('now').from('stores').select('id,category_id,slug,name_ar,name_en,is_active').order('sort_order'),
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').order('sort_order'),
  admin.schema('now').from('products').select('id,store_id,catalog_category_id,name_ar,name_en,base_price,is_active').order('created_at', { ascending: false }).limit(2000),
]);

const error = storesResult.error || categoriesResult.error || productsResult.error;
if (error) {
  console.error('[power-bank-inspect] Database query failed:', error.message);
  process.exit(1);
}

const stores = storesResult.data ?? [];
const categories = categoriesResult.data ?? [];
const products = productsResult.data ?? [];

const airpods = categories.find((category) => {
  const name = `${category.name_ar ?? ''} ${category.name_en ?? ''} ${category.slug ?? ''}`.toLowerCase();
  return name.includes('اير بودز') || name.includes('airpods');
});

if (!airpods?.parent_id) {
  console.log('[power-bank-inspect] ' + JSON.stringify({ error: 'AirPods category/parent not found' }));
  process.exit(0);
}

const parent = categories.find((category) => category.id === airpods.parent_id) ?? null;
const children = categories
  .filter((category) => category.parent_id === airpods.parent_id)
  .map((category) => ({
    ...category,
    product_count: products.filter((product) => product.catalog_category_id === category.id).length,
    samples: products
      .filter((product) => product.catalog_category_id === category.id)
      .slice(0, 3)
      .map((product) => ({ name_ar: product.name_ar, name_en: product.name_en, base_price: product.base_price })),
  }));

const store = stores.find((item) => item.id === airpods.store_id) ?? null;
const powerMatches = categories.filter((category) => {
  const value = `${category.name_ar ?? ''} ${category.name_en ?? ''} ${category.slug ?? ''}`.toLowerCase();
  return value.includes('باور') || value.includes('power');
});

console.log('[power-bank-inspect] ' + JSON.stringify({ store, parent, children, powerMatches }));
