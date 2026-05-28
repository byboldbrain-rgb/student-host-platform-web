'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertyBookingRequestsAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import { notifyAdminsByRole } from '@/src/lib/notifications/admin-push'

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim()

  if (!value) {
    throw new Error(`${key} is required`)
  }

  return value
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim()
  return value || null
}

function parseRequestedOptionCode(value: string): RequestedOptionCode {
  if (
    value === 'single_room' ||
    value === 'double_room' ||
    value === 'triple_room' ||
    value === 'full_apartment'
  ) {
    return value
  }

  throw new Error('Invalid requested option')
}

function getRequestedOptionLabel(optionCode: RequestedOptionCode) {
  if (optionCode === 'single_room') return 'Single Room'
  if (optionCode === 'double_room') return 'Double Room'
  if (optionCode === 'triple_room') return 'Triple Room'
  return 'Full Apartment'
}

export async function createAdminInternalBookingRequestAction(formData: FormData) {
  const adminContext = await requirePropertyBookingRequestsAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  const propertyId = getRequiredString(formData, 'property_id')
  const requestedOptionCode = parseRequestedOptionCode(
    getRequiredString(formData, 'requested_option_code')
  )

  const customerName = getRequiredString(formData, 'customer_name')
  const customerPhone = getOptionalString(formData, 'customer_phone')
  const customerEmail = getOptionalString(formData, 'customer_email')
  const customerWhatsapp = getOptionalString(formData, 'customer_whatsapp')
  const preferredStartDate = getOptionalString(formData, 'preferred_start_date')
  const preferredEndDate = getOptionalString(formData, 'preferred_end_date')
  const adminNotes = getOptionalString(formData, 'admin_internal_notes')

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(`
      id,
      property_id,
      title_en,
      title_ar,
      broker_id,
      availability_status
    `)
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error(propertyError.message)
  }

  if (!property) {
    throw new Error('Property not found')
  }

  if (property.availability_status === 'inactive') {
    throw new Error('This property is inactive')
  }

  if (!isSuperAdmin(admin)) {
    if (!admin.broker_id) {
      throw new Error('Editor account is missing broker assignment')
    }

    if (property.broker_id !== admin.broker_id) {
      throw new Error('You are not allowed to create a request for this property')
    }
  }

  const requestedOptionLabel = getRequestedOptionLabel(requestedOptionCode)

  const message = [
    `Requested option: ${requestedOptionLabel}`,
    adminNotes ? `Admin internal notes: ${adminNotes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const { data: insertedRequest, error: insertError } = await supabase
    .from('property_booking_requests')
    .insert({
      property_id: property.id,
      broker_id: property.broker_id,
      user_id: null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_whatsapp: customerWhatsapp,
      preferred_start_date: preferredStartDate,
      preferred_end_date: preferredEndDate,
      message,
      requested_option_code: requestedOptionCode,
      status: 'new',
      request_source: 'admin_internal',
      created_by_admin_id: admin.id,
      admin_internal_notes: adminNotes,
    })
    .select('id')
    .single()

  if (insertError || !insertedRequest) {
    throw new Error(insertError?.message || 'Failed to create booking request')
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'admin_internal_booking_request_created',
    target_table: 'property_booking_requests',
    target_id: insertedRequest.id,
    details: {
      property_id: property.id,
      property_public_id: property.property_id,
      requested_option_code: requestedOptionCode,
      request_source: 'admin_internal',
    },
  })

  try {
    const propertyTitle =
      property.title_en || property.title_ar || property.property_id || 'Property'

    await notifyAdminsByRole({
      roles: [
        'super_admin',
        'properties_super_admin',
        'property_editor',
        'property_receiver',
      ],
      payload: {
        title: 'New internal booking request',
        body: `${customerName} requested ${requestedOptionLabel} for ${propertyTitle}.`,
        url: '/admin/properties/booking-requests',
        tag: `admin-internal-booking-request-${insertedRequest.id}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      },
    })
  } catch (notificationError) {
    console.warn(
      'Internal booking request was created, but push notification failed:',
      notificationError
    )
  }

  revalidatePath('/admin/properties/booking-requests')
  revalidatePath('/admin/properties/booking-requests/new')
}