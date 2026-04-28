'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  requirePropertiesSectionAccess,
  requirePropertyOwnerAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'

type PayoutMethod =
  | 'bank_transfer'
  | 'instapay'
  | 'vodafone_cash'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'cash'

type UniversityLocationRow = {
  id: string
  city_id: string
}

function parseRequiredString(value: FormDataEntryValue | null, label: string) {
  const parsed = String(value || '').trim()

  if (!parsed) {
    throw new Error(`${label} is required`)
  }

  return parsed
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value || '').trim()
  return parsed || null
}

function parseBoolean(value: FormDataEntryValue | null, defaultValue = false) {
  const parsed = String(value || '').trim()

  if (!parsed) return defaultValue

  return parsed === 'true'
}

function parseOptionalStringArray(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  )
}

function parseOwnerUniversityIds(formData: FormData) {
  const multiUniversityIds = parseOptionalStringArray(
    formData.getAll('university_ids')
  )

  if (multiUniversityIds.length > 0) {
    return multiUniversityIds
  }

  const legacyUniversityId = parseOptionalString(formData.get('university_id'))
  return legacyUniversityId ? [legacyUniversityId] : []
}

async function getAuthorizedPropertiesContext() {
  const adminContext = await requirePropertiesSectionAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin

  return {
    supabase,
    admin,
  }
}

async function getAuthorizedOwnerSelfContext() {
  const adminContext = await requirePropertyOwnerAccess()
  const supabase = createAdminClient()
  const admin = adminContext.admin
  const ownerId = String(admin.owner_id || '').trim()

  if (!ownerId) {
    throw new Error('Owner account is not linked')
  }

  return {
    supabase,
    admin,
    ownerId,
  }
}

async function getPrimaryBrokerIdForOwner(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
}) {
  const { supabase, ownerId } = params

  const { data: ownerPropertyLink, error: ownerPropertyLinkError } = await supabase
    .from('owner_properties')
    .select('broker_id')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ownerPropertyLinkError) {
    throw new Error(ownerPropertyLinkError.message)
  }

  const linkedBrokerId = String(ownerPropertyLink?.broker_id || '').trim()
  if (linkedBrokerId) return linkedBrokerId

  const { data: directProperty, error: directPropertyError } = await supabase
    .from('properties')
    .select('broker_id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (directPropertyError) {
    throw new Error(directPropertyError.message)
  }

  const directBrokerId = String(directProperty?.broker_id || '').trim()
  if (directBrokerId) return directBrokerId

  throw new Error(
    'No broker is linked to this owner yet. Link the owner to a property or owner_properties record first.'
  )
}

async function assertBrokerAccess(params: { admin: any; brokerId: string }) {
  const { admin, brokerId } = params

  if (isSuperAdmin(admin)) return

  if (!admin.broker_id) {
    throw new Error('Editor account is missing broker assignment')
  }

  if (admin.broker_id !== brokerId) {
    throw new Error('You are not allowed to manage owners for this broker')
  }
}

async function assertOwnerLocationIsValid(params: {
  supabase: ReturnType<typeof createAdminClient>
  cityId: string | null
  universityId: string | null
}) {
  const { supabase, cityId, universityId } = params

  if (!cityId && !universityId) return

  if (cityId) {
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('id', cityId)
      .maybeSingle()

    if (cityError) {
      throw new Error(cityError.message)
    }

    if (!city) {
      throw new Error('Selected owner city was not found')
    }
  }

  if (universityId) {
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('id, city_id')
      .eq('id', universityId)
      .maybeSingle()

    if (universityError) {
      throw new Error(universityError.message)
    }

    if (!university) {
      throw new Error('Selected owner university was not found')
    }

    if (cityId && university.city_id !== cityId) {
      throw new Error('Selected owner university does not belong to the selected city')
    }
  }
}

async function assertOwnerUniversitiesAreValid(params: {
  supabase: ReturnType<typeof createAdminClient>
  universityIds: string[]
}) {
  const { supabase, universityIds } = params

  if (universityIds.length === 0) {
    return [] as UniversityLocationRow[]
  }

  const { data: universities, error } = await supabase
    .from('universities')
    .select('id, city_id')
    .in('id', universityIds)

  if (error) {
    throw new Error(error.message)
  }

  const foundUniversities = (universities ?? []) as UniversityLocationRow[]
  const foundUniversityIds = new Set(foundUniversities.map((university) => university.id))

  const missingUniversityIds = universityIds.filter(
    (universityId) => !foundUniversityIds.has(universityId)
  )

  if (missingUniversityIds.length > 0) {
    throw new Error('One or more selected universities were not found')
  }

  return foundUniversities
}

async function setOwnerServiceAreas(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  universityIds: string[]
  adminId: string
}) {
  const { supabase, ownerId, universityIds, adminId } = params
  const now = new Date().toISOString()

  const selectedUniversityIds = Array.from(
    new Set(universityIds.map((value) => String(value || '').trim()).filter(Boolean))
  )

  const selectedUniversities = await assertOwnerUniversitiesAreValid({
    supabase,
    universityIds: selectedUniversityIds,
  })

  const { data: existingAreasData, error: existingAreasError } = await supabase
    .from('property_owner_service_areas')
    .select('id, university_id, is_active')
    .eq('owner_id', ownerId)

  if (existingAreasError) {
    throw new Error(existingAreasError.message)
  }

  const existingAreas = (existingAreasData ?? []) as {
    id: string
    university_id: string | null
    is_active: boolean
  }[]

  const selectedUniversityIdSet = new Set(selectedUniversityIds)

  const activeAreasToDeactivate = existingAreas.filter((area) => {
    const universityId = String(area.university_id || '').trim()
    return area.is_active && (!universityId || !selectedUniversityIdSet.has(universityId))
  })

  if (activeAreasToDeactivate.length > 0) {
    const { error: deactivateError } = await supabase
      .from('property_owner_service_areas')
      .update({
        is_active: false,
        updated_by_admin_id: adminId,
        updated_at: now,
      })
      .in(
        'id',
        activeAreasToDeactivate.map((area) => area.id)
      )

    if (deactivateError) {
      throw new Error(deactivateError.message)
    }
  }

  if (selectedUniversityIds.length === 0) {
    return
  }

  const existingAreaByUniversityId = new Map<
  string,
  {
    id: string
    university_id: string | null
    is_active: boolean
  }
>()

existingAreas.forEach((area) => {
  const universityId = String(area.university_id || '').trim()

  if (!universityId) return

  existingAreaByUniversityId.set(universityId, area)
})

  for (const university of selectedUniversities) {
    const existingArea = existingAreaByUniversityId.get(university.id)

    if (existingArea) {
      if (!existingArea.is_active) {
        const { error: reactivateError } = await supabase
          .from('property_owner_service_areas')
          .update({
            city_id: university.city_id,
            is_active: true,
            updated_by_admin_id: adminId,
            updated_at: now,
          })
          .eq('id', existingArea.id)

        if (reactivateError) {
          throw new Error(reactivateError.message)
        }
      }

      continue
    }

    const { error: insertError } = await supabase
      .from('property_owner_service_areas')
      .insert({
        owner_id: ownerId,
        city_id: university.city_id,
        university_id: university.id,
        is_active: true,
        created_by_admin_id: adminId,
        updated_by_admin_id: adminId,
      })

    if (insertError) {
      throw new Error(insertError.message)
    }
  }
}

async function setOwnerPrimaryServiceArea(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  cityId: string | null
  universityId: string | null
  adminId: string
}) {
  const { supabase, ownerId, universityId, adminId } = params

  await setOwnerServiceAreas({
    supabase,
    ownerId,
    universityIds: universityId ? [universityId] : [],
    adminId,
  })
}

async function assertOwnerAccessForBroker(params: {
  supabase: ReturnType<typeof createAdminClient>
  admin: any
  ownerId: string
  brokerId: string
}) {
  const { supabase, admin, ownerId, brokerId } = params

  await assertBrokerAccess({
    admin,
    brokerId,
  })

  const { data: owner, error: ownerError } = await supabase
    .from('property_owners')
    .select('id, is_active')
    .eq('id', ownerId)
    .maybeSingle()

  if (ownerError) {
    throw new Error(ownerError.message)
  }

  if (!owner) {
    throw new Error('Owner not found')
  }

  if (isSuperAdmin(admin)) {
    return owner as {
      id: string
      is_active: boolean
    }
  }

  const { data: ownerPropertyLink, error: ownerPropertyLinkError } =
    await supabase
      .from('owner_properties')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

  if (ownerPropertyLinkError) {
    throw new Error(ownerPropertyLinkError.message)
  }

  if (ownerPropertyLink) {
    return owner as {
      id: string
      is_active: boolean
    }
  }

  const { data: directProperty, error: directPropertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .limit(1)
    .maybeSingle()

  if (directPropertyError) {
    throw new Error(directPropertyError.message)
  }

  if (!directProperty) {
    throw new Error('You are not allowed to manage this owner')
  }

  return owner as {
    id: string
    is_active: boolean
  }
}

async function assertPayoutAccountAccess(params: {
  supabase: ReturnType<typeof createAdminClient>
  admin: any
  payoutAccountId: string
}) {
  const { supabase, admin, payoutAccountId } = params

  const { data: payoutAccount, error } = await supabase
    .from('owner_payout_accounts')
    .select('id, owner_id, broker_id')
    .eq('id', payoutAccountId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!payoutAccount) {
    throw new Error('Payout account not found')
  }

  await assertBrokerAccess({
    admin,
    brokerId: payoutAccount.broker_id,
  })

  return payoutAccount as {
    id: string
    owner_id: string
    broker_id: string
  }
}

async function assertOwnerSelfPayoutAccountAccess(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  payoutAccountId: string
}) {
  const { supabase, ownerId, payoutAccountId } = params

  const { data: payoutAccount, error } = await supabase
    .from('owner_payout_accounts')
    .select('id, owner_id, broker_id')
    .eq('id', payoutAccountId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!payoutAccount) {
    throw new Error('Payout account not found')
  }

  if (payoutAccount.owner_id !== ownerId) {
    throw new Error('You are not allowed to manage this payout account')
  }

  return payoutAccount as {
    id: string
    owner_id: string
    broker_id: string
  }
}

function assertValidPayoutMethod(method: string): asserts method is PayoutMethod {
  const allowedMethods = [
    'bank_transfer',
    'instapay',
    'vodafone_cash',
    'orange_cash',
    'etisalat_cash',
    'cash',
  ]

  if (!allowedMethods.includes(method)) {
    throw new Error('Invalid payout method')
  }
}

function assertPayoutDetails(params: {
  payoutMethod: PayoutMethod
  accountHolderName: string | null
  bankName: string | null
  bankAccountNumber: string | null
  iban: string | null
  walletNumber: string | null
  instapayHandle: string | null
}) {
  const {
    payoutMethod,
    accountHolderName,
    bankName,
    bankAccountNumber,
    iban,
    walletNumber,
    instapayHandle,
  } = params

  if (payoutMethod === 'bank_transfer') {
    if (!accountHolderName?.trim()) {
      throw new Error('Account holder name is required for bank transfer')
    }

    if (!bankName?.trim()) {
      throw new Error('Bank name is required for bank transfer')
    }

    if (!bankAccountNumber?.trim() && !iban?.trim()) {
      throw new Error('Bank account number or IBAN is required for bank transfer')
    }

    return
  }

  if (payoutMethod === 'instapay') {
    if (!instapayHandle?.trim()) {
      throw new Error('Instapay handle is required')
    }

    return
  }

  if (
    payoutMethod === 'vodafone_cash' ||
    payoutMethod === 'orange_cash' ||
    payoutMethod === 'etisalat_cash'
  ) {
    if (!walletNumber?.trim()) {
      throw new Error('Wallet number is required for cash wallet payout')
    }

    return
  }

  if (payoutMethod === 'cash') {
    return
  }
}

async function unsetOtherDefaultPayoutAccounts(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  brokerId: string
  exceptPayoutAccountId?: string | null
}) {
  const { supabase, ownerId, brokerId, exceptPayoutAccountId = null } = params

  let query = supabase
    .from('owner_payout_accounts')
    .update({
      is_default: false,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .eq('is_default', true)

  if (exceptPayoutAccountId) {
    query = query.neq('id', exceptPayoutAccountId)
  }

  const { error } = await query

  if (error) {
    throw new Error(error.message)
  }
}

async function maybeMakeFirstActiveAccountDefault(params: {
  supabase: ReturnType<typeof createAdminClient>
  ownerId: string
  brokerId: string
}) {
  const { supabase, ownerId, brokerId } = params

  const { data: defaultAccount, error: defaultError } = await supabase
    .from('owner_payout_accounts')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .eq('is_active', true)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (defaultError) {
    throw new Error(defaultError.message)
  }

  if (defaultAccount) return

  const { data: firstAccount, error: firstAccountError } = await supabase
    .from('owner_payout_accounts')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('broker_id', brokerId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstAccountError) {
    throw new Error(firstAccountError.message)
  }

  if (!firstAccount) return

  const { error: updateError } = await supabase
    .from('owner_payout_accounts')
    .update({
      is_default: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', firstAccount.id)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

function parsePayoutFormFields(formData: FormData) {
  const payoutMethod = parseRequiredString(
    formData.get('payout_method'),
    'Payout method'
  )
  const accountHolderName = parseOptionalString(formData.get('account_holder_name'))
  const phoneNumber = parseOptionalString(formData.get('phone_number'))
  const bankName = parseOptionalString(formData.get('bank_name'))
  const bankAccountNumber = parseOptionalString(formData.get('bank_account_number'))
  const iban = parseOptionalString(formData.get('iban'))
  const walletNumber = parseOptionalString(formData.get('wallet_number'))
  const instapayHandle = parseOptionalString(formData.get('instapay_handle'))
  const isDefault = parseBoolean(formData.get('is_default'), false)
  const isActive = parseBoolean(formData.get('is_active'), true)
  const notes = parseOptionalString(formData.get('notes'))

  assertValidPayoutMethod(payoutMethod)

  assertPayoutDetails({
    payoutMethod,
    accountHolderName,
    bankName,
    bankAccountNumber,
    iban,
    walletNumber,
    instapayHandle,
  })

  return {
    payoutMethod,
    accountHolderName,
    phoneNumber,
    bankName,
    bankAccountNumber,
    iban,
    walletNumber,
    instapayHandle,
    isDefault,
    isActive,
    notes,
  }
}

export async function updateOwnerSelfProfileAction(formData: FormData) {
  const adminContext = await requirePropertyOwnerAccess()
  const supabase = createAdminClient()

  const ownerId = String(adminContext.admin.owner_id || '').trim()

  if (!ownerId) {
    throw new Error('Owner account is not linked')
  }

  const fullName = parseRequiredString(formData.get('full_name'), 'Owner full name')
  const cityId = parseOptionalString(formData.get('city_id'))
  const universityId = parseOptionalString(formData.get('university_id'))
  const universityIds = parseOwnerUniversityIds(formData)
  const phoneNumber = parseOptionalString(formData.get('phone_number'))
  const whatsappNumber = parseOptionalString(formData.get('whatsapp_number'))
  const email = parseOptionalString(formData.get('email'))
  const companyName = parseOptionalString(formData.get('company_name'))
  const nationalId = parseOptionalString(formData.get('national_id'))
  const taxId = parseOptionalString(formData.get('tax_id'))

  await assertOwnerLocationIsValid({
    supabase,
    cityId,
    universityId,
  })

  await assertOwnerUniversitiesAreValid({
    supabase,
    universityIds,
  })

  const { error } = await supabase
    .from('property_owners')
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      company_name: companyName,
      national_id: nationalId,
      tax_id: taxId,
      updated_by_admin_id: adminContext.admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ownerId)

  if (error) {
    throw new Error(error.message)
  }

  await setOwnerServiceAreas({
    supabase,
    ownerId,
    universityIds,
    adminId: adminContext.admin.id,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: adminContext.admin.id,
    action_type: 'property_owner_self_profile_updated',
    target_table: 'property_owners',
    target_id: ownerId,
    details: {
      full_name: fullName,
      city_id: cityId,
      university_id: universityId,
      university_ids: universityIds,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      company_name: companyName,
      national_id: nationalId,
      tax_id: taxId,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/new')
}

export async function createOwnerSelfPayoutAccountAction(formData: FormData) {
  const { supabase, admin, ownerId } = await getAuthorizedOwnerSelfContext()
  const brokerId = await getPrimaryBrokerIdForOwner({ supabase, ownerId })
  const fields = parsePayoutFormFields(formData)

  const { data: existingActiveAccount, error: existingActiveAccountError } =
    await supabase
      .from('owner_payout_accounts')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

  if (existingActiveAccountError) {
    throw new Error(existingActiveAccountError.message)
  }

  const shouldBeDefault = fields.isDefault || !existingActiveAccount

  if (shouldBeDefault) {
    await unsetOtherDefaultPayoutAccounts({
      supabase,
      ownerId,
      brokerId,
    })
  }

  const { data: payoutAccount, error } = await supabase
    .from('owner_payout_accounts')
    .insert({
      owner_id: ownerId,
      broker_id: brokerId,
      payout_method: fields.payoutMethod,
      account_holder_name: fields.accountHolderName,
      phone_number: fields.phoneNumber,
      bank_name: fields.bankName,
      bank_account_number: fields.bankAccountNumber,
      iban: fields.iban,
      wallet_number: fields.walletNumber,
      instapay_handle: fields.instapayHandle,
      is_default: shouldBeDefault,
      is_active: fields.isActive,
      notes: fields.notes,
      created_by_admin_id: admin.id,
      updated_by_admin_id: admin.id,
    })
    .select('id')
    .single()

  if (error || !payoutAccount) {
    throw new Error(error?.message || 'Failed to create payout account')
  }

  if (!fields.isActive) {
    await maybeMakeFirstActiveAccountDefault({
      supabase,
      ownerId,
      brokerId,
    })
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_self_payout_account_created',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccount.id,
    details: {
      owner_id: ownerId,
      broker_id: brokerId,
      payout_method: fields.payoutMethod,
      is_default: shouldBeDefault,
      is_active: fields.isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function updateOwnerSelfPayoutAccountAction(formData: FormData) {
  const payoutAccountId = parseRequiredString(
    formData.get('payout_account_id'),
    'Payout account id'
  )
  const { supabase, admin, ownerId } = await getAuthorizedOwnerSelfContext()
  const fields = parsePayoutFormFields(formData)

  const payoutAccount = await assertOwnerSelfPayoutAccountAccess({
    supabase,
    ownerId,
    payoutAccountId,
  })

  if (fields.isDefault && fields.isActive) {
    await unsetOtherDefaultPayoutAccounts({
      supabase,
      ownerId,
      brokerId: payoutAccount.broker_id,
      exceptPayoutAccountId: payoutAccountId,
    })
  }

  const { error } = await supabase
    .from('owner_payout_accounts')
    .update({
      payout_method: fields.payoutMethod,
      account_holder_name: fields.accountHolderName,
      phone_number: fields.phoneNumber,
      bank_name: fields.bankName,
      bank_account_number: fields.bankAccountNumber,
      iban: fields.iban,
      wallet_number: fields.walletNumber,
      instapay_handle: fields.instapayHandle,
      is_default: fields.isActive ? fields.isDefault : false,
      is_active: fields.isActive,
      notes: fields.notes,
      updated_by_admin_id: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutAccountId)

  if (error) {
    throw new Error(error.message)
  }

  await maybeMakeFirstActiveAccountDefault({
    supabase,
    ownerId,
    brokerId: payoutAccount.broker_id,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_self_payout_account_updated',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccountId,
    details: {
      owner_id: ownerId,
      broker_id: payoutAccount.broker_id,
      payout_method: fields.payoutMethod,
      is_default: fields.isActive ? fields.isDefault : false,
      is_active: fields.isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function deleteOwnerSelfPayoutAccountAction(formData: FormData) {
  const payoutAccountId = parseRequiredString(
    formData.get('payout_account_id'),
    'Payout account id'
  )
  const { supabase, admin, ownerId } = await getAuthorizedOwnerSelfContext()

  const payoutAccount = await assertOwnerSelfPayoutAccountAccess({
    supabase,
    ownerId,
    payoutAccountId,
  })

  const { error } = await supabase
    .from('owner_payout_accounts')
    .update({
      is_active: false,
      is_default: false,
      updated_by_admin_id: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutAccountId)

  if (error) {
    throw new Error(error.message)
  }

  await maybeMakeFirstActiveAccountDefault({
    supabase,
    ownerId,
    brokerId: payoutAccount.broker_id,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_self_payout_account_deactivated',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccountId,
    details: {
      owner_id: ownerId,
      broker_id: payoutAccount.broker_id,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function createOwnerAction(formData: FormData) {
  const brokerId = parseRequiredString(formData.get('broker_id'), 'Broker')
  const fullName = parseRequiredString(formData.get('full_name'), 'Owner full name')
  const cityId = parseOptionalString(formData.get('city_id'))
  const universityId = parseOptionalString(formData.get('university_id'))
  const universityIds = parseOwnerUniversityIds(formData)
  const phoneNumber = parseOptionalString(formData.get('phone_number'))
  const whatsappNumber = parseOptionalString(formData.get('whatsapp_number'))
  const email = parseOptionalString(formData.get('email'))
  const nationalId = parseOptionalString(formData.get('national_id'))
  const taxId = parseOptionalString(formData.get('tax_id'))
  const companyName = parseOptionalString(formData.get('company_name'))
  const billingName = parseOptionalString(formData.get('billing_name'))
  const billingAddress = parseOptionalString(formData.get('billing_address'))
  const notes = parseOptionalString(formData.get('notes'))
  const isActive = parseBoolean(formData.get('is_active'), true)

  const { supabase, admin } = await getAuthorizedPropertiesContext()

  await assertBrokerAccess({
    admin,
    brokerId,
  })

  await assertOwnerLocationIsValid({
    supabase,
    cityId,
    universityId,
  })

  await assertOwnerUniversitiesAreValid({
    supabase,
    universityIds,
  })

  const { data: owner, error } = await supabase
    .from('property_owners')
    .insert({
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      national_id: nationalId,
      tax_id: taxId,
      company_name: companyName,
      billing_name: billingName,
      billing_address: billingAddress,
      notes,
      is_active: isActive,
      created_by_admin_id: admin.id,
      updated_by_admin_id: admin.id,
    })
    .select('id')
    .single()

  if (error || !owner) {
    throw new Error(error?.message || 'Failed to create owner')
  }

  await setOwnerServiceAreas({
    supabase,
    ownerId: owner.id,
    universityIds,
    adminId: admin.id,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'property_owner_created',
    target_table: 'property_owners',
    target_id: owner.id,
    details: {
      broker_id: brokerId,
      full_name: fullName,
      city_id: cityId,
      university_id: universityId,
      university_ids: universityIds,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      national_id: nationalId,
      tax_id: taxId,
      company_name: companyName,
      is_active: isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/owners')
  revalidatePath('/admin/properties/new')
  revalidatePath('/admin/properties')
}

export async function updateOwnerAction(formData: FormData) {
  const ownerId = parseRequiredString(formData.get('owner_id'), 'Owner id')
  const submittedBrokerId = parseRequiredString(formData.get('broker_id'), 'Broker')
  const fullName = parseRequiredString(formData.get('full_name'), 'Owner full name')
  const cityId = parseOptionalString(formData.get('city_id'))
  const universityId = parseOptionalString(formData.get('university_id'))
  const universityIds = parseOwnerUniversityIds(formData)
  const phoneNumber = parseOptionalString(formData.get('phone_number'))
  const whatsappNumber = parseOptionalString(formData.get('whatsapp_number'))
  const email = parseOptionalString(formData.get('email'))
  const nationalId = parseOptionalString(formData.get('national_id'))
  const taxId = parseOptionalString(formData.get('tax_id'))
  const companyName = parseOptionalString(formData.get('company_name'))
  const billingName = parseOptionalString(formData.get('billing_name'))
  const billingAddress = parseOptionalString(formData.get('billing_address'))
  const notes = parseOptionalString(formData.get('notes'))
  const isActive = parseBoolean(formData.get('is_active'), true)

  const { supabase, admin } = await getAuthorizedPropertiesContext()

  await assertOwnerAccessForBroker({
    supabase,
    admin,
    ownerId,
    brokerId: submittedBrokerId,
  })

  await assertOwnerLocationIsValid({
    supabase,
    cityId,
    universityId,
  })

  await assertOwnerUniversitiesAreValid({
    supabase,
    universityIds,
  })

  const { error } = await supabase
    .from('property_owners')
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      national_id: nationalId,
      tax_id: taxId,
      company_name: companyName,
      billing_name: billingName,
      billing_address: billingAddress,
      notes,
      is_active: isActive,
      updated_by_admin_id: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ownerId)

  if (error) {
    throw new Error(error.message)
  }

  await setOwnerServiceAreas({
    supabase,
    ownerId,
    universityIds,
    adminId: admin.id,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'property_owner_updated',
    target_table: 'property_owners',
    target_id: ownerId,
    details: {
      broker_id: submittedBrokerId,
      full_name: fullName,
      city_id: cityId,
      university_id: universityId,
      university_ids: universityIds,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email,
      national_id: nationalId,
      tax_id: taxId,
      company_name: companyName,
      is_active: isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/owners')
  revalidatePath('/admin/properties/new')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function createOwnerPayoutAccountAction(formData: FormData) {
  const ownerId = parseRequiredString(formData.get('owner_id'), 'Owner id')
  const submittedBrokerId = parseRequiredString(formData.get('broker_id'), 'Broker')
  const fields = parsePayoutFormFields(formData)

  const { supabase, admin } = await getAuthorizedPropertiesContext()

  await assertOwnerAccessForBroker({
    supabase,
    admin,
    ownerId,
    brokerId: submittedBrokerId,
  })

  const { data: existingActiveAccount, error: existingActiveAccountError } =
    await supabase
      .from('owner_payout_accounts')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('broker_id', submittedBrokerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

  if (existingActiveAccountError) {
    throw new Error(existingActiveAccountError.message)
  }

  const shouldBeDefault = fields.isDefault || !existingActiveAccount

  if (shouldBeDefault) {
    await unsetOtherDefaultPayoutAccounts({
      supabase,
      ownerId,
      brokerId: submittedBrokerId,
    })
  }

  const { data: payoutAccount, error } = await supabase
    .from('owner_payout_accounts')
    .insert({
      owner_id: ownerId,
      broker_id: submittedBrokerId,
      payout_method: fields.payoutMethod,
      account_holder_name: fields.accountHolderName,
      phone_number: fields.phoneNumber,
      bank_name: fields.bankName,
      bank_account_number: fields.bankAccountNumber,
      iban: fields.iban,
      wallet_number: fields.walletNumber,
      instapay_handle: fields.instapayHandle,
      is_default: shouldBeDefault,
      is_active: fields.isActive,
      notes: fields.notes,
      created_by_admin_id: admin.id,
      updated_by_admin_id: admin.id,
    })
    .select('id')
    .single()

  if (error || !payoutAccount) {
    throw new Error(error?.message || 'Failed to create payout account')
  }

  if (!fields.isActive) {
    await maybeMakeFirstActiveAccountDefault({
      supabase,
      ownerId,
      brokerId: submittedBrokerId,
    })
  }

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_payout_account_created',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccount.id,
    details: {
      owner_id: ownerId,
      broker_id: submittedBrokerId,
      payout_method: fields.payoutMethod,
      is_default: shouldBeDefault,
      is_active: fields.isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/owners')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function updateOwnerPayoutAccountAction(formData: FormData) {
  const payoutAccountId = parseRequiredString(
    formData.get('payout_account_id'),
    'Payout account id'
  )
  const ownerId = parseRequiredString(formData.get('owner_id'), 'Owner id')
  const submittedBrokerId = parseRequiredString(formData.get('broker_id'), 'Broker')
  const fields = parsePayoutFormFields(formData)

  const { supabase, admin } = await getAuthorizedPropertiesContext()

  const payoutAccount = await assertPayoutAccountAccess({
    supabase,
    admin,
    payoutAccountId,
  })

  if (payoutAccount.owner_id !== ownerId) {
    throw new Error('Payout account owner mismatch')
  }

  if (payoutAccount.broker_id !== submittedBrokerId) {
    throw new Error('Payout account broker mismatch')
  }

  await assertOwnerAccessForBroker({
    supabase,
    admin,
    ownerId,
    brokerId: submittedBrokerId,
  })

  if (fields.isDefault && fields.isActive) {
    await unsetOtherDefaultPayoutAccounts({
      supabase,
      ownerId,
      brokerId: submittedBrokerId,
      exceptPayoutAccountId: payoutAccountId,
    })
  }

  const { error } = await supabase
    .from('owner_payout_accounts')
    .update({
      payout_method: fields.payoutMethod,
      account_holder_name: fields.accountHolderName,
      phone_number: fields.phoneNumber,
      bank_name: fields.bankName,
      bank_account_number: fields.bankAccountNumber,
      iban: fields.iban,
      wallet_number: fields.walletNumber,
      instapay_handle: fields.instapayHandle,
      is_default: fields.isActive ? fields.isDefault : false,
      is_active: fields.isActive,
      notes: fields.notes,
      updated_by_admin_id: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutAccountId)

  if (error) {
    throw new Error(error.message)
  }

  await maybeMakeFirstActiveAccountDefault({
    supabase,
    ownerId,
    brokerId: submittedBrokerId,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_payout_account_updated',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccountId,
    details: {
      owner_id: ownerId,
      broker_id: submittedBrokerId,
      payout_method: fields.payoutMethod,
      is_default: fields.isActive ? fields.isDefault : false,
      is_active: fields.isActive,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/owners')
  revalidatePath('/admin/finance/owner-settlements')
}

export async function deleteOwnerPayoutAccountAction(formData: FormData) {
  const payoutAccountId = parseRequiredString(
    formData.get('payout_account_id'),
    'Payout account id'
  )
  const ownerId = parseRequiredString(formData.get('owner_id'), 'Owner id')
  const submittedBrokerId = parseRequiredString(formData.get('broker_id'), 'Broker')

  const { supabase, admin } = await getAuthorizedPropertiesContext()

  const payoutAccount = await assertPayoutAccountAccess({
    supabase,
    admin,
    payoutAccountId,
  })

  if (payoutAccount.owner_id !== ownerId) {
    throw new Error('Payout account owner mismatch')
  }

  if (payoutAccount.broker_id !== submittedBrokerId) {
    throw new Error('Payout account broker mismatch')
  }

  await assertOwnerAccessForBroker({
    supabase,
    admin,
    ownerId,
    brokerId: submittedBrokerId,
  })

  const { error } = await supabase
    .from('owner_payout_accounts')
    .update({
      is_active: false,
      is_default: false,
      updated_by_admin_id: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutAccountId)

  if (error) {
    throw new Error(error.message)
  }

  await maybeMakeFirstActiveAccountDefault({
    supabase,
    ownerId,
    brokerId: submittedBrokerId,
  })

  await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    action_type: 'owner_payout_account_deactivated',
    target_table: 'owner_payout_accounts',
    target_id: payoutAccountId,
    details: {
      owner_id: ownerId,
      broker_id: submittedBrokerId,
    },
  })

  revalidatePath('/admin/owners')
  revalidatePath('/admin/properties/owners')
  revalidatePath('/admin/finance/owner-settlements')
}