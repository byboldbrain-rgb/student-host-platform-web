import { NextResponse } from 'next/server';

import { createAdminClient } from '@/src/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'not available' }, { status: 404 });
  }

  const admin = createAdminClient();
  const [storeCategoriesResult, storesResult, categoriesResult] = await Promise.all([
    admin.schema('now').from('store_categories').select('id,slug,name_ar,name_en').order('sort_order'),
    admin.schema('now').from('stores').select('id,category_id,slug,name_ar,name_en,is_active').order('sort_order'),
    admin.schema('now').from('catalog_categories').select('id,store_id,parent_id,slug,name_ar,name_en,is_active,sort_order').order('sort_order'),
  ]);

  const error = storeCategoriesResult.error || storesResult.error || categoriesResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  const storeIds = new Set(candidateStores.map((store) => store.id));
  const candidateCategories = categories.filter((category) => {
    if (!storeIds.has(category.store_id)) return false;
    const value = [category.slug, category.name_ar, category.name_en].filter(Boolean).join(' ').toLowerCase();
    return value.includes('mobile') || value.includes('access') || value.includes('power') || value.includes('اكسس') || value.includes('إكسس') || value.includes('موبايل') || value.includes('باور');
  });

  return NextResponse.json({ candidateStores, candidateCategories });
}
