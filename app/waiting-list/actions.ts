'use server'

import { createAdminClient } from '@/src/lib/supabase/admin'

type WaitingListInput = {
  fullName: string
  phone?: string
  whatsapp?: string
  email: string
  cityId: string
  universityId: string
  collegeId?: string
  gender?: string
  preferredScope?: string
  preferredRoomType?: string
  minBudgetEgp?: string
  maxBudgetEgp?: string
  message?: string
}

function normalizeOptionalUuid(value?: string) {
  const cleanValue = String(value || '').trim()
  return cleanValue || null
}

function normalizeOptionalNumber(value?: string) {
  const cleanValue = String(value || '').trim()

  if (!cleanValue) {
    return null
  }

  const numberValue = Number(cleanValue)

  if (Number.isNaN(numberValue) || numberValue < 0) {
    throw new Error('قيمة الميزانية غير صحيحة')
  }

  return numberValue
}

export async function getWaitingListOptionsAction() {
  const supabase = createAdminClient()

  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_ar', { ascending: true })

  if (citiesError) {
    throw new Error(citiesError.message)
  }

  const { data: universities, error: universitiesError } = await supabase
    .from('universities')
    .select('id, city_id, name_en, name_ar')
    .order('name_ar', { ascending: true })

  if (universitiesError) {
    throw new Error(universitiesError.message)
  }

  const { data: colleges, error: collegesError } = await supabase
    .from('colleges')
    .select('id, university_id, name_en, name_ar')
    .eq('is_active', true)
    .order('name_ar', { ascending: true })

  if (collegesError) {
    throw new Error(collegesError.message)
  }

  return {
    cities: cities || [],
    universities: universities || [],
    colleges: colleges || [],
  }
}

export async function completeWaitingListAction(input: WaitingListInput) {
  const supabase = createAdminClient()

  const fullName = String(input.fullName || '').trim()
  const phone = String(input.phone || '').trim()
  const whatsapp = String(input.whatsapp || '').trim()
  const email = String(input.email || '').trim().toLowerCase()
  const cityId = String(input.cityId || '').trim()
  const universityId = String(input.universityId || '').trim()
  const collegeId = normalizeOptionalUuid(input.collegeId)
  const gender = String(input.gender || '').trim() || null
  const preferredScope = String(input.preferredScope || '').trim() || 'any'
  const preferredRoomType = String(input.preferredRoomType || '').trim() || 'any'
  const minBudgetEgp = normalizeOptionalNumber(input.minBudgetEgp)
  const maxBudgetEgp = normalizeOptionalNumber(input.maxBudgetEgp)
  const message = String(input.message || '').trim()

  if (!fullName) {
    throw new Error('الاسم الكامل مطلوب')
  }

  if (!email) {
    throw new Error('البريد الإلكتروني مطلوب')
  }

  if (!cityId) {
    throw new Error('اختيار المحافظة / المدينة مطلوب')
  }

  if (!universityId) {
    throw new Error('اختيار الجامعة مطلوب')
  }

  if (
    minBudgetEgp !== null &&
    maxBudgetEgp !== null &&
    minBudgetEgp > maxBudgetEgp
  ) {
    throw new Error('الحد الأدنى للميزانية لا يمكن أن يكون أكبر من الحد الأقصى')
  }

  const { data: waitingListRequest, error: waitingListError } = await supabase
    .from('property_waiting_list_requests')
    .insert({
      user_id: null,
      full_name: fullName,
      phone,
      email,
      whatsapp,
      city_id: cityId,
      university_id: universityId,
      college_id: collegeId,
      gender,
      rental_duration: 'monthly',
      preferred_scope: preferredScope,
      preferred_room_type: preferredRoomType,
      min_budget_egp: minBudgetEgp,
      max_budget_egp: maxBudgetEgp,
      message,
      notify_by_push: false,
      notify_by_email: false,
      notify_by_whatsapp: Boolean(whatsapp || phone),
      status: 'active',
      extra_data: {
        source: 'waiting_list_public_form',
        account_created: false,
      },
    })
    .select('id')
    .single()

  if (waitingListError) {
    throw new Error(waitingListError.message)
  }

  return {
    success: true,
    waitingListRequestId: waitingListRequest.id,
  }
}