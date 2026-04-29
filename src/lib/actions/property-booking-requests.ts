'use server'

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { notifyAdminsByRole } from '@/src/lib/notifications/admin-push'

export type RequestedOptionCode =
  | 'triple_room'
  | 'double_room'
  | 'single_room'
  | 'full_apartment'

export type CreatePropertyBookingRequestResult =
  | {
      success: true
      requestId: string
    }
  | {
      success: false
      error: string
      code?:
        | 'UNAUTHENTICATED'
        | 'PROFILE_NOT_FOUND'
        | 'PROFILE_INCOMPLETE'
        | 'PROPERTY_NOT_FOUND'
        | 'UNKNOWN'
    }

function getRequestedOptionLabel(optionCode: RequestedOptionCode) {
  if (optionCode === 'triple_room') return 'Triple Room'
  if (optionCode === 'double_room') return 'Double Room'
  if (optionCode === 'single_room') return 'Single Room'
  return 'Full Apartment'
}

async function getOpenPropertyBookingRequestsCount() {
  const supabaseAdmin = createAdminClient()

  const { count, error } = await supabaseAdmin
    .from('property_booking_requests')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .in('status', ['new', 'contacted', 'in_progress'])

  if (error) {
    console.warn(
      'Failed to count open property booking requests:',
      error.message
    )
    return 0
  }

  return count || 0
}

export async function createPropertyBookingRequestFromProfile(
  propertyId: string,
  requestedOptionCode: RequestedOptionCode,
  requestedOptionLabel?: string
): Promise<CreatePropertyBookingRequestResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return {
        success: false,
        error: userError.message,
        code: 'UNAUTHENTICATED',
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'You must sign in first.',
        code: 'UNAUTHENTICATED',
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, whatsapp')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
        code: 'PROFILE_NOT_FOUND',
      }
    }

    if (!profile) {
      return {
        success: false,
        error: 'User profile was not found.',
        code: 'PROFILE_NOT_FOUND',
      }
    }

    const fullName = profile.full_name?.trim() || ''
    const phone = profile.phone?.trim() || ''
    const whatsapp = profile.whatsapp?.trim() || ''
    const email = user.email?.trim() || ''

    if (!fullName || (!phone && !email)) {
      return {
        success: false,
        error:
          'Your profile is incomplete. Please complete your account details first.',
        code: 'PROFILE_INCOMPLETE',
      }
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, property_id, title_en, title_ar, broker_id')
      .eq('id', propertyId)
      .maybeSingle()

    if (propertyError) {
      return {
        success: false,
        error: propertyError.message,
        code: 'PROPERTY_NOT_FOUND',
      }
    }

    if (!property) {
      return {
        success: false,
        error: 'العقار غير موجود.',
        code: 'PROPERTY_NOT_FOUND',
      }
    }

    const normalizedOptionLabel =
      requestedOptionLabel?.trim() || getRequestedOptionLabel(requestedOptionCode)

    const bookingMessage = `Requested option: ${normalizedOptionLabel}`

    const { data: insertedRequest, error: insertError } = await supabase
      .from('property_booking_requests')
      .insert({
        property_id: property.id,
        broker_id: property.broker_id,
        user_id: user.id,
        customer_name: fullName,
        customer_phone: phone || null,
        customer_email: email || null,
        customer_whatsapp: whatsapp || null,
        requested_option_code: requestedOptionCode,
        message: bookingMessage,
      })
      .select('id')
      .single()

    if (insertError) {
      return {
        success: false,
        error: insertError.message,
        code: 'UNKNOWN',
      }
    }

    const propertyTitle =
      property.title_en || property.title_ar || property.property_id || 'Property'

    try {
      const badgeCount = await getOpenPropertyBookingRequestsCount()

      await notifyAdminsByRole({
        roles: [
          'super_admin',
          'properties_super_admin',
          'property_editor',
          'property_receiver',
        ],
        payload: {
          title: 'New reservation request',
          body: `${fullName} requested ${normalizedOptionLabel} for ${propertyTitle}.`,
          url: '/admin/properties/booking-requests',
          tag: `property-booking-request-${insertedRequest.id}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          badgeCount,
        },
      })
    } catch (notificationError) {
      console.warn(
        'Booking request was created, but push notification failed:',
        notificationError
      )
    }

    return {
      success: true,
      requestId: insertedRequest.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.',
      code: 'UNKNOWN',
    }
  }
}