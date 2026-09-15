import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storeId = '67892e11-863b-4115-a56a-958a38ea61ce';

if (!url || !key) {
  console.log('[power-bank-inspect] Supabase admin env is unavailable in this deployment.');
  process.exit(0);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [storeResult, airpodsResult] = await Promise.all([
  admin.schema('now').from('stores').select('id,slug,name_ar,name_en,is_active').eq('id', storeId).maybeSingle(),
  admin
    .schema('now')
    .from('catalog_categories')
    .select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order')
    .eq('store_id', storeId)
    .eq('slug', 'mobile-accessories-airpods')
    .maybeSingle(),
]);

const firstError = storeResult.error || airpodsResult.error;
if (firstError) {
  console.error('[power-bank-inspect] Initial query failed:', firstError.message);
  process.exit(1);
}

const airpods = airpodsResult.data;
if (!airpods?.parent_id) {
  console.log('[power-bank-inspect] ' + JSON.stringify({ store: storeResult.data, error: 'Exact AirPods category/parent not found' }));
  process.exit(0);
}

const [parentResult, childrenResult, powerResult] = await Promise.all([
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').eq('id', airpods.parent_id).maybeSingle(),
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').eq('store_id', storeId).eq('parent_id', airpods.parent_id).order('sort_order'),
  admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').eq('store_id', storeId).or('slug.ilike.%power%,name_ar.ilike.%باور%,name_en.ilike.%power%').order('sort_order'),
]);

const error = parentResult.error || childrenResult.error || powerResult.error;
if (error) {
  console.error('[power-bank-inspect] Hierarchy query failed:', error.message);
  process.exit(1);
}

const children = childrenResult.data ?? [];
const childIds = children.map((item) => item.id);
const productsResult = childIds.length
  ? await admin.schema('now').from('products').select('id,catalog_category_id,name_ar,name_en,base_price,is_active').in('catalog_category_id', childIds).order('created_at', { ascending: false })
  : { data: [], error: null };

if (productsResult.error) {
  console.error('[power-bank-inspect] Product query failed:', productsResult.error.message);
  process.exit(1);
}

const products = productsResult.data ?? [];
const enrichedChildren = children.map((category) => ({
  ...category,
  product_count: products.filter((product) => product.catalog_category_id === category.id).length,
  samples: products
    .filter((product) => product.catalog_category_id === category.id)
    .slice(0, 3)
    .map((product) => ({ name_ar: product.name_ar, name_en: product.name_en, base_price: product.base_price })),
}));

console.log('[power-bank-inspect] ' + JSON.stringify({
  store: storeResult.data,
  parent: parentResult.data,
  children: enrichedChildren,
  powerMatches: powerResult.data ?? [],
}));
