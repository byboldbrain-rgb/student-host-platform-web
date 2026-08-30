// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getCachedSakanSeoPages } from './properties/data'
import { SITE_URL } from '@/src/lib/site'

const STATIC_PAGES_LAST_MODIFIED = new Date('2026-07-17T00:00:00.000Z')
const PRIVACY_POLICY_LAST_MODIFIED = new Date('2026-08-30T00:00:00.000Z')

type SitemapPropertyUniversity = {
  university_id?: string | number | null
}

type SitemapPropertyRow = {
  property_id?: string | null
  city_id?: string | number | null
  area_id?: string | number | null
  updated_at?: string | null
  created_at?: string | null
  property_universities?: SitemapPropertyUniversity[] | null
}

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

function getLatestDate(
  dates: Array<Date | string | null | undefined>,
  fallback = STATIC_PAGES_LAST_MODIFIED,
) {
  const validDates = dates
    .map((value) => {
      if (!value) return null

      const date = value instanceof Date ? value : new Date(value)

      return Number.isNaN(date.getTime()) ? null : date
    })
    .filter((date): date is Date => Boolean(date))

  if (validDates.length === 0) {
    return fallback
  }

  return validDates.reduce((latestDate, currentDate) =>
    currentDate.getTime() > latestDate.getTime()
      ? currentDate
      : latestDate,
  )
}

function setLatestDateForKey(
  map: Map<string, Date>,
  key: string | number | null | undefined,
  date: Date,
) {
  const normalizedKey = String(key ?? '').trim()

  if (!normalizedKey) return

  const currentDate = map.get(normalizedKey)

  if (!currentDate || date.getTime() > currentDate.getTime()) {
    map.set(normalizedKey, date)
  }
}

function normalizePublicPath(path?: string | null) {
  const normalizedPath = String(path ?? '').trim()

  if (!normalizedPath) return null

  return normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`
}

function removeDuplicateUrls(
  entries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const uniqueEntries = new Map<
    string,
    MetadataRoute.Sitemap[number]
  >()

  for (const entry of entries) {
    if (!entry.url) continue

    const normalizedUrl = entry.url.replace(/\/$/, '')

    if (!uniqueEntries.has(normalizedUrl)) {
      uniqueEntries.set(normalizedUrl, {
        ...entry,
        url: normalizedUrl,
      })
    }
  }

  return Array.from(uniqueEntries.values())
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient()
  const sakanSeoPages = await getCachedSakanSeoPages()

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `
      property_id,
      city_id,
      area_id,
      updated_at,
      created_at,
      property_universities(
        university_id
      )
    `,
    )
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

  const sitemapProperties =
    (properties as SitemapPropertyRow[] | null) ?? []

  const latestDateByCityId = new Map<string, Date>()
  const latestDateByAreaId = new Map<string, Date>()
  const latestDateByUniversityId = new Map<string, Date>()

  for (const property of sitemapProperties) {
    const propertyLastModified = getValidDate(
      property.updated_at,
      property.created_at,
    )

    setLatestDateForKey(
      latestDateByCityId,
      property.city_id,
      propertyLastModified,
    )

    setLatestDateForKey(
      latestDateByAreaId,
      property.area_id,
      propertyLastModified,
    )

    for (const universityLink of property.property_universities ?? []) {
      setLatestDateForKey(
        latestDateByUniversityId,
        universityLink.university_id,
        propertyLastModified,
      )
    }
  }

  const indexableSakanPages = sakanSeoPages.filter(
    (page) =>
      page.is_indexable &&
      page.published_properties_count >= 3 &&
      Boolean(normalizePublicPath(page.path)),
  )

  const latestPropertyUpdate = getLatestDate(
    sitemapProperties.flatMap((property) => [
      property.updated_at,
      property.created_at,
    ]),
  )

  const latestSakanUpdate = getLatestDate(
    indexableSakanPages.map((page) => page.seo_updated_at),
  )

  const propertiesPageLastModified = getLatestDate([
    latestPropertyUpdate,
    latestSakanUpdate,
  ])

  /*
    الصفحة الرئيسية أصبحت صفحة فعلية للبراند، لذلك نضيفها إلى
    الـSitemap مع إبقاء /properties كصفحة مستقلة لاستعراض السكن.
  */
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: propertiesPageLastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: propertiesPageLastModified,
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
      url: `${SITE_URL}/privacy-policy`,
      lastModified: PRIVACY_POLICY_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
  ]

  const sakanPages = indexableSakanPages.reduce<MetadataRoute.Sitemap>(
    (entries, page) => {
      const normalizedPath = normalizePublicPath(page.path)

      if (!normalizedPath) {
        return entries
      }

      const pageType = String(page.page_type || '').toLowerCase()
      const seoLastModified = getValidDate(page.seo_updated_at)

      const relatedPropertyLastModified =
        pageType === 'area' && page.area_id
          ? latestDateByAreaId.get(String(page.area_id))
          : pageType === 'university' && page.university_id
            ? latestDateByUniversityId.get(String(page.university_id))
            : page.city_id
              ? latestDateByCityId.get(String(page.city_id))
              : undefined

      const pageLastModified = getLatestDate([
        seoLastModified,
        relatedPropertyLastModified,
      ])

      entries.push({
        url: `${SITE_URL}${normalizedPath}`,
        lastModified: pageLastModified,
        changeFrequency: 'daily',
        priority:
          pageType === 'city'
            ? 0.95
            : pageType === 'university'
              ? 0.9
              : 0.85,
      })

      return entries
    },
    [],
  )

  const propertyPages: MetadataRoute.Sitemap =
    sitemapProperties
      .filter((property) => Boolean(property.property_id))
      .map((property) => ({
        url: `${SITE_URL}/properties/${property.property_id}`,
        lastModified: getValidDate(
          property.updated_at,
          property.created_at,
        ),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })) ?? []

  return removeDuplicateUrls([
    ...staticPages,
    ...sakanPages,
    ...propertyPages,
  ])
}
