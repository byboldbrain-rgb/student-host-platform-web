// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getCachedSakanSeoPages } from './properties/data'
import { SITE_URL } from '@/src/lib/site'

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient()
  const sakanSeoPages = await getCachedSakanSeoPages()

  const { data: properties, error } = await supabase
    .from('properties')
    .select('property_id, updated_at, created_at')
    .eq('admin_status', 'published')
    .eq('is_active', true)
    .neq('availability_status', 'unavailable')
    .neq('availability_status', 'inactive')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(5000)

  if (error) {
    throw new Error(`Failed to load properties sitemap: ${error.message}`)
  }

  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/board`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ]

  const sakanPages: MetadataRoute.Sitemap = sakanSeoPages
    .filter(
      (page) =>
        page.is_indexable &&
        page.published_properties_count >= 3 &&
        Boolean(page.path)
    )
    .map((page) => ({
      url: `${SITE_URL}${page.path}`,
      lastModified: page.seo_updated_at
        ? new Date(page.seo_updated_at)
        : now,
      changeFrequency: 'daily' as const,
      priority:
        page.page_type === 'city'
          ? 0.95
          : page.page_type === 'university'
            ? 0.9
            : 0.85,
    }))

  const propertyPages: MetadataRoute.Sitemap =
    properties?.map((property) => ({
      url: `${SITE_URL}/properties/${property.property_id}`,
      lastModified: property.updated_at
        ? new Date(property.updated_at)
        : property.created_at
          ? new Date(property.created_at)
          : now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })) ?? []

  return [...staticPages, ...sakanPages, ...propertyPages]
}
