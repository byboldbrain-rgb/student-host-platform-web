'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'

type RelatedCity = {
  name_en: string
  name_ar: string
}

type RelatedUniversity = {
  name_en: string
  name_ar: string
}

type RelatedCollege = {
  name_en: string | null
  name_ar: string | null
}

type RawWaitingListAnswer = {
  id: string
  user_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  whatsapp: string | null
  gender: string | null
  rental_duration: string | null
  preferred_scope: string | null
  preferred_room_type: string | null
  min_budget_egp: number | null
  max_budget_egp: number | null
  preferred_start_date: string | null
  preferred_end_date: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  beds_count: number | null
  guests_count: number | null
  message: string | null
  status: string
  matched_count: number
  created_at: string
  updated_at: string
  extra_data: {
    source?: string
    account_created?: boolean
    [key: string]: unknown
  } | null
  city: RelatedCity[] | RelatedCity | null
  university: RelatedUniversity[] | RelatedUniversity | null
  college: RelatedCollege[] | RelatedCollege | null
}

export type WaitingListAnswer = {
  id: string
  user_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  whatsapp: string | null
  gender: string | null
  rental_duration: string | null
  preferred_scope: string | null
  preferred_room_type: string | null
  min_budget_egp: number | null
  max_budget_egp: number | null
  preferred_start_date: string | null
  preferred_end_date: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  beds_count: number | null
  guests_count: number | null
  message: string | null
  status: string
  matched_count: number
  created_at: string
  updated_at: string
  extra_data: {
    source?: string
    account_created?: boolean
    [key: string]: unknown
  } | null
  city: RelatedCity | null
  university: RelatedUniversity | null
  college: RelatedCollege | null
}

function normalizeSingleRelation<T>(value: T[] | T | null): T | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value
}

export async function getWaitingListAnswersAction() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('property_waiting_list_requests')
    .select(
      `
      id,
      user_id,
      full_name,
      phone,
      email,
      whatsapp,
      gender,
      rental_duration,
      preferred_scope,
      preferred_room_type,
      min_budget_egp,
      max_budget_egp,
      preferred_start_date,
      preferred_end_date,
      bedrooms_count,
      bathrooms_count,
      beds_count,
      guests_count,
      message,
      status,
      matched_count,
      created_at,
      updated_at,
      extra_data,
      city:cities (
        name_en,
        name_ar
      ),
      university:universities (
        name_en,
        name_ar
      ),
      college:colleges (
        name_en,
        name_ar
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const rawAnswers = (data || []) as RawWaitingListAnswer[]

  const answers: WaitingListAnswer[] = rawAnswers.map((answer) => ({
    ...answer,
    city: normalizeSingleRelation(answer.city),
    university: normalizeSingleRelation(answer.university),
    college: normalizeSingleRelation(answer.college),
  }))

  return answers
}

export async function updateWaitingListAnswerStatusAction(
  requestId: string,
  status: 'active' | 'matched' | 'paused' | 'cancelled' | 'expired'
) {
  const supabase = createAdminClient()

  const cleanRequestId = String(requestId || '').trim()

  if (!cleanRequestId) {
    throw new Error('رقم الطلب غير صحيح')
  }

  const { error } = await supabase
    .from('property_waiting_list_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanRequestId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
  }
}