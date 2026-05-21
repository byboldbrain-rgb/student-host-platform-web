import 'server-only'

import { revalidatePath, revalidateTag } from 'next/cache'
import { NAVIENTY_CACHE_TAGS } from './data'

export function revalidatePropertyListingCaches(
  propertyId?: string | number
) {
  revalidateTag(NAVIENTY_CACHE_TAGS.propertyListings, 'max')
  revalidateTag(NAVIENTY_CACHE_TAGS.popularProperties, 'max')

  if (propertyId) {
    revalidateTag(`navienty:property:${propertyId}`, 'max')
  }

  revalidatePath('/properties')
  revalidatePath('/properties/search')

  if (propertyId) {
    revalidatePath(`/properties/${propertyId}`)
  }
}

export function revalidateSearchFacetCaches() {
  revalidateTag(NAVIENTY_CACHE_TAGS.searchFacets, 'max')
  revalidateTag(NAVIENTY_CACHE_TAGS.cities, 'max')
  revalidateTag(NAVIENTY_CACHE_TAGS.universities, 'max')
  revalidateTag(NAVIENTY_CACHE_TAGS.propertyAreas, 'max')
  revalidateTag(NAVIENTY_CACHE_TAGS.universityPropertyAreas, 'max')

  revalidatePath('/properties')
  revalidatePath('/properties/search')
}