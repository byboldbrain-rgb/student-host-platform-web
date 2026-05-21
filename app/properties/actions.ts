// app/properties/actions.ts
'use server'

import { createClient } from '../../src/lib/supabase/server'
import {
  revalidatePropertyListingCaches,
  revalidateSearchFacetCaches,
} from './cache'

export async function updatePropertyStatus(
  propertyId: string,
  availabilityStatus: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .update({ availability_status: availabilityStatus })
    .eq('property_id', propertyId)

  if (error) {
    throw new Error(`Failed to update property status: ${error.message}`)
  }

  revalidatePropertyListingCaches(propertyId)
}

export async function updatePropertyPricing(
  propertyId: string,
  priceEgp: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .update({ price_egp: priceEgp })
    .eq('property_id', propertyId)

  if (error) {
    throw new Error(`Failed to update property price: ${error.message}`)
  }

  revalidatePropertyListingCaches(propertyId)
}

export async function createPropertyArea(input: {
  city_id: string | number
  name_en: string
  name_ar: string
  sort_order?: number
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('property_areas').insert({
    city_id: input.city_id,
    name_en: input.name_en,
    name_ar: input.name_ar,
    sort_order: input.sort_order ?? 0,
    is_active: true,
  })

  if (error) {
    throw new Error(`Failed to create property area: ${error.message}`)
  }

  revalidateSearchFacetCaches()
}

export async function linkUniversityToArea(input: {
  university_id: string | number
  area_id: string | number
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('university_property_areas')
    .insert(input)

  if (error) {
    throw new Error(`Failed to link university to area: ${error.message}`)
  }

  revalidateSearchFacetCaches()
}