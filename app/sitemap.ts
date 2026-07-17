// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getCachedSakanSeoPages } from './properties/data'
import { SITE_URL } from '@/src/lib/site'

const STATIC_PAGES_LAST_MODIFIED = new Date('2026-07-17T00:00:00.000Z')

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

function getValidDate(
  primaryValue?: string | null,
  fallbackValue?: string | null,
) {
  const primaryDate = primaryValue ? new Date(primaryValue) : null

  if (primaryDate && !Number.isNaN(primaryDate.getTime())) {
    return primaryDate
  }

  const fallbackDate = fallbackValue ? new Date(fallbackValue) : null

  if (fallbackDate && !Number.isNaN(fallbackDate.getTime())) {
    return fallbackDate
  }

  return STATIC_PAGES_LAST_MODIFIED
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
    .order('updated_at', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(5000)

  if (error) {
    throw new Error(
      `Failed to load properties sitemap: ${error.message}`,
    )
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/board`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
  ]

  const sakanPages: MetadataRoute.Sitemap = sakanSeoPages
    .filter(
      (page) =>
        page.is_indexable &&
        page.published_properties_count >= 3 &&
        Boolean(page.path),
    )
    .map((page) => ({
      url: `${SITE_URL}${page.path}`,
      lastModified: getValidDate(page.seo_updated_at),
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
      lastModified: getValidDate(
        property.updated_at,
        property.created_at,
      ),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })) ?? []

  return [
    ...staticPages,
    ...sakanPages,
    ...propertyPages,
  ]
}