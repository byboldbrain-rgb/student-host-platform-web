import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storeId = '67892e11-863b-4115-a56a-958a38ea61ce';
const parentId = 'c63f46e8-7431-42e2-8bc6-7faf63b6b493';

if (!url || !key) {
  console.log('[power-bank-inspect] Supabase admin env is unavailable in this deployment.');
  process.exit(0);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [parentResult, childrenResult, powerResult] = await Promise.all([
  admin.schema('now').from('catalog_categories').select('id,slug,name_ar,name_en,is_active').eq('id', parentId).maybeSingle(),
  admin.schema('now').from('catalog_categories').select('id,slug,name_ar,name_en,is_active,sort_order').eq('store_id', storeId).eq('parent_id', parentId).order('sort_order'),
  admin.schema('now').from('catalog_categories').select('id,parent_id,slug,name_ar,name_en,is_active,sort_order').eq('store_id', storeId).or('slug.ilike.%power%,name_ar.ilike.%باور%,name_en.ilike.%power%').order('sort_order'),
]);

const error = parentResult.error || childrenResult.error || powerResult.error;
if (error) {
  console.error('[power-bank-inspect] Query failed:', error.message);
  process.exit(1);
}

console.log('[power-bank-inspect] ' + JSON.stringify({
  parent: parentResult.data,
  children: childrenResult.data ?? [],
  powerMatches: powerResult.data ?? [],
}));
