import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export const NAVIENTY_CACHE_TAGS = {
  cities: 'navienty:cities',
  universities: 'navienty:universities',
  propertyAreas: 'navienty:property-areas',
  universityPropertyAreas: 'navienty:university-property-areas',
  propertyListings: 'navienty:property-listings',
  popularProperties: 'navienty:properties:popular',
  searchFacets: 'navienty:search-facets',
  sakanSeoPages: 'navienty:sakan-seo-pages',
} as const

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

export type SeoFaqItem = {
  q: string
  a: string
}

export type SakanSeoPage = {
  page_type: 'city' | 'university' | 'area'
  entity_id: string
  city_id: string
  university_id: string | null
  area_id: string | null
  city_slug: string
  university_slug: string | null
  area_slug: string | null
  path: string
  entity_name_ar: string
  entity_name_en: string
  seo_title_ar: string | null
  seo_description_ar: string | null
  seo_h1_ar: string | null
  seo_intro_ar: string | null
  seo_faq_ar: SeoFaqItem[] | null
  is_indexable: boolean
  seo_updated_at: string | null
  published_properties_count: number
}

export type PropertyUniversityLink = {
  university_id?: string | number | null
}

export type PropertyImage = {
  image_url?: string | null
  is_cover?: boolean | null
  sort_order?: number | null
}

export type PropertySellableOption = {
  id?: string | null
  code?: string | null
  option_code?: string | null
  price_egp?: number | null
  is_active?: boolean | null
  deleted_at?: string | null
}

export type PropertyRoomSellableOption = {
  id?: string | null
  code?: string | null
  price_egp?: number | null
  is_active?: boolean | null
  deleted_at?: string | null
}

export type PropertyRoom = {
  id?: string | null
  is_active?: boolean | null
  deleted_at?: string | null
  is_reserved_summer_course?: boolean | null
  is_reserved_academic_year?: boolean | null
  property_room_sellable_options?: PropertyRoomSellableOption[] | null
}

export type CachedPropertyListing = {
  id: string | number
  property_id: string
  title_en: string
  title_ar: string
  price_egp: number
  rental_duration: string
  availability_status: string
  gender?: 'boys' | 'girls' | string | null
  city_id?: string | number | null
  university_id?: string | number | null
  area_id?: string | number | null
  property_universities?: PropertyUniversityLink[] | null
  property_images?: PropertyImage[] | null
  property_sellable_options?: PropertySellableOption[] | null
  property_rooms?: PropertyRoom[] | null
}

function normalizePath(path: string) {
  const cleanPath = path.trim()

  if (!cleanPath) return '/'

  const withLeadingSlash = cleanPath.startsWith('/')
    ? cleanPath
    : `/${cleanPath}`

  return withLeadingSlash.replace(/\/+$/, '') || '/'
}

export const getCachedCities = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('cities')
      .select(`
        id,
        name_en,
        name_ar,
        slug,
        is_indexable,
        seo_title_ar,
        seo_description_ar,
        seo_h1_ar,
        seo_intro_ar,
        seo_faq_ar,
        seo_updated_at
      `)
      .order('name_en', { ascending: true })

    if (error) {
      throw new Error(`Failed to load cities: ${error.message}`)
    }

    return data ?? []
  },
  ['navienty', 'cities'],
  {
    tags: [NAVIENTY_CACHE_TAGS.cities, NAVIENTY_CACHE_TAGS.searchFacets],
    revalidate: 60 * 60 * 24,
  }
)

export const getCachedUniversities = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('universities')
      .select(`
        id,
        name_en,
        name_ar,
        city_id,
        slug,
        is_indexable,
        seo_title_ar,
        seo_description_ar,
        seo_h1_ar,
        seo_intro_ar,
        seo_faq_ar,
        seo_updated_at
      `)
      .order('name_en', { ascending: true })

    if (error) {
      throw new Error(`Failed to load universities: ${error.message}`)
    }

    return data ?? []
  },
  ['navienty', 'universities'],
  {
    tags: [
      NAVIENTY_CACHE_TAGS.universities,
      NAVIENTY_CACHE_TAGS.searchFacets,
    ],
    revalidate: 60 * 60 * 24,
  }
)

export const getCachedPropertyAreas = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('property_areas')
      .select(`
        id,
        city_id,
        name_en,
        name_ar,
        is_active,
        slug,
        is_indexable,
        seo_title_ar,
        seo_description_ar,
        seo_h1_ar,
        seo_intro_ar,
        seo_faq_ar,
        seo_updated_at
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true })

    if (error) {
      throw new Error(`Failed to load property areas: ${error.message}`)
    }

    return data ?? []
  },
  ['navienty', 'property-areas', 'active'],
  {
    tags: [
      NAVIENTY_CACHE_TAGS.propertyAreas,
      NAVIENTY_CACHE_TAGS.searchFacets,
    ],
    revalidate: 60 * 60 * 6,
  }
)

export const getCachedUniversityPropertyAreas = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('university_property_areas')
      .select('id, university_id, area_id')

    if (error) {
      throw new Error(
        `Failed to load university/property area links: ${error.message}`
      )
    }

    return data ?? []
  },
  ['navienty', 'university-property-areas'],
  {
    tags: [
      NAVIENTY_CACHE_TAGS.universityPropertyAreas,
      NAVIENTY_CACHE_TAGS.searchFacets,
    ],
    revalidate: 60 * 60 * 6,
  }
)

export const getCachedPopularProperties = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        property_id,
        title_en,
        title_ar,
        price_egp,
        rental_duration,
        availability_status,
        gender,
        city_id,
        university_id,
        area_id,
        property_universities(
          university_id
        ),
        property_images(
          image_url,
          is_cover,
          sort_order
        ),
        property_sellable_options(
          id,
          code,
          option_code,
          price_egp,
          is_active,
          deleted_at
        ),
        property_rooms(
          id,
          is_active,
          deleted_at,
          is_reserved_summer_course,
          is_reserved_academic_year,
          property_room_sellable_options(
            id,
            code,
            price_egp,
            is_active,
            deleted_at
          )
        )
      `)
      .eq('admin_status', 'published')
      .eq('is_active', true)
      .neq('availability_status', 'unavailable')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      throw new Error(`Failed to load popular properties: ${error.message}`)
    }

    return (data ?? []) as CachedPropertyListing[]
  },
  [
    'navienty',
    'properties',
    'popular',
    'published-active',
    'limit-300',
    'season-reservation-flags-v1',
  ],
  {
    tags: [
      NAVIENTY_CACHE_TAGS.propertyListings,
      NAVIENTY_CACHE_TAGS.popularProperties,
    ],
    revalidate: 60,
  }
)

export const getCachedSakanSeoPages = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from('sakan_seo_pages')
      .select(`
        page_type,
        entity_id,
        city_id,
        university_id,
        area_id,
        city_slug,
        university_slug,
        area_slug,
        path,
        entity_name_ar,
        entity_name_en,
        seo_title_ar,
        seo_description_ar,
        seo_h1_ar,
        seo_intro_ar,
        seo_faq_ar,
        is_indexable,
        seo_updated_at,
        published_properties_count
      `)
      .eq('is_indexable', true)
      .gte('published_properties_count', 3)
      .order('published_properties_count', { ascending: false })

    if (error) {
      throw new Error(`Failed to load Sakan SEO pages: ${error.message}`)
    }

    return (data ?? []) as SakanSeoPage[]
  },
  ['navienty', 'sakan-seo-pages', 'indexable'],
  {
    tags: [NAVIENTY_CACHE_TAGS.sakanSeoPages],
    revalidate: 60 * 60,
  }
)

export const getCachedSakanSeoPageByPath = unstable_cache(
  async (path: string) => {
    const supabase = createPublicSupabaseClient()
    const normalizedPath = normalizePath(path)

    const { data, error } = await supabase
      .from('sakan_seo_pages')
      .select(`
        page_type,
        entity_id,
        city_id,
        university_id,
        area_id,
        city_slug,
        university_slug,
        area_slug,
        path,
        entity_name_ar,
        entity_name_en,
        seo_title_ar,
        seo_description_ar,
        seo_h1_ar,
        seo_intro_ar,
        seo_faq_ar,
        is_indexable,
        seo_updated_at,
        published_properties_count
      `)
      .eq('path', normalizedPath)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load Sakan SEO page: ${error.message}`)
    }

    return data as SakanSeoPage | null
  },
  ['navienty', 'sakan-seo-page-by-path'],
  {
    tags: [NAVIENTY_CACHE_TAGS.sakanSeoPages],
    revalidate: 60 * 60,
  }
)

function propertyMatchesSakanPage(
  property: CachedPropertyListing,
  seoPage: SakanSeoPage
) {
  if (seoPage.page_type === 'city') {
    return String(property.city_id) === String(seoPage.city_id)
  }

  if (seoPage.page_type === 'area') {
    return String(property.area_id) === String(seoPage.area_id)
  }

  if (seoPage.page_type === 'university') {
    const directUniversityMatch =
      String(property.university_id) === String(seoPage.university_id)

    const linkedUniversityMatch =
      property.property_universities?.some(
        (item) =>
          item.university_id &&
          String(item.university_id) === String(seoPage.university_id)
      ) ?? false

    return directUniversityMatch || linkedUniversityMatch
  }

  return false
}

export async function getCachedSakanPageData(path: string) {
  const seoPage = await getCachedSakanSeoPageByPath(path)

  if (!seoPage) {
    return {
      seoPage: null,
      properties: [],
    }
  }

  let allPopularSource: CachedPropertyListing[] = []

  try {
    allPopularSource = await getCachedPopularProperties()
  } catch (error) {
    console.error(
      '[sakan] Popular properties query failed; continuing with SEO data only.',
      error
    )
  }

  const properties = allPopularSource
    .filter((property) => propertyMatchesSakanPage(property, seoPage))
    .slice(0, 80)

  return {
    seoPage,
    properties,
  }
}

export async function getCachedPropertiesPageData() {
  const [cities, universities, areas, universityAreas, allPopularSource] =
    await Promise.all([
      getCachedCities(),
      getCachedUniversities(),
      getCachedPropertyAreas(),
      getCachedUniversityPropertyAreas(),
      getCachedPopularProperties(),
    ])

  return {
    cities,
    universities,
    areas,
    universityAreas,
    allPopularSource,
  }
}
