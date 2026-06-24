'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'

type OutreachPreviewResult = {
  ok: boolean
  campaignId?: string
  summary?: {
    totalRows: number
    readyCount: number
    skippedCount: number
    invalidCount: number
    duplicateInBatchCount: number
    alreadyContactedCount: number
  }
  rows?: OutreachPreviewRow[]
  error?: string
}

type OutreachPreviewRow = {
  rowNumber: number
  phone: string
  normalizedPhone: string | null
  ownerName: string | null
  areaName: string | null
  areaSlug: string | null
  status: 'ready' | 'skipped'
  skippedReason: string | null
}

type ParsedOutreachRow = {
  rowNumber: number
  phone: string
  ownerName: string | null
  areaName: string | null
  areaSlug: string | null
  rawRow: Record<string, unknown>
}

const DEFAULT_TEMPLATE_NAME = 'owner_onboarding_intro'
const DEFAULT_TEMPLATE_LANGUAGE = 'ar_EG'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeWhatsAppNumber(value: string | null | undefined) {
  const rawValue = String(value || '').trim()

  if (!rawValue) return null

  const cleanedValue = rawValue.replace(/[^\d+]/g, '')

  if (cleanedValue.startsWith('+')) {
    const digits = cleanedValue.replace(/\D/g, '')
    return digits || null
  }

  const digitsOnly = cleanedValue.replace(/\D/g, '')

  if (!digitsOnly) return null

  if (digitsOnly.startsWith('00')) {
    return digitsOnly.slice(2)
  }

  if (digitsOnly.startsWith('01') && digitsOnly.length === 11) {
    return `20${digitsOnly.slice(1)}`
  }

  if (digitsOnly.startsWith('1') && digitsOnly.length === 10) {
    return `20${digitsOnly}`
  }

  if (digitsOnly.startsWith('20') && digitsOnly.length >= 12) {
    return digitsOnly
  }

  return digitsOnly
}

function isValidEgyptianWhatsAppNumber(value: string | null) {
  if (!value) return false

  return /^201[0125]\d{8}$/.test(value)
}

function parseCsvLine(line: string) {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === ',' && !insideQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())

  return result
}

function parseOutreachInput(input: string): ParsedOutreachRow[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const firstColumns = parseCsvLine(lines[0]).map((column) =>
    column.trim().toLowerCase()
  )

  const hasHeader = firstColumns.some((column) =>
    ['phone', 'owner_name', 'area_name', 'area_slug'].includes(column)
  )

  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map((line, index) => {
    const columns = parseCsvLine(line)

    const rowNumber = hasHeader ? index + 2 : index + 1

    return {
      rowNumber,
      phone: columns[0]?.trim() || '',
      ownerName: columns[1]?.trim() || null,
      areaName: columns[2]?.trim() || null,
      areaSlug: columns[3]?.trim() || null,
      rawRow: {
        original_line: line,
        columns,
      },
    }
  })
}

function getTodayCampaignName() {
  const date = new Date().toISOString().slice(0, 10)
  return `Owner outreach - ${date}`
}

export async function createOutreachPreviewAction(
  formData: FormData
): Promise<OutreachPreviewResult> {
  try {
    await requireSuperAdminAccess()

    const input = String(formData.get('rows') || '').trim()
    const campaignName =
      String(formData.get('campaignName') || '').trim() || getTodayCampaignName()

    const templateName =
      String(formData.get('templateName') || '').trim() || DEFAULT_TEMPLATE_NAME

    const templateLanguage =
      String(formData.get('templateLanguage') || '').trim() ||
      DEFAULT_TEMPLATE_LANGUAGE

    if (!input) {
      return {
        ok: false,
        error: 'اكتب الأرقام والبيانات الأول.',
      }
    }

    const parsedRows = parseOutreachInput(input)

    if (parsedRows.length === 0) {
      return {
        ok: false,
        error: 'مفيش بيانات صالحة للمعالجة.',
      }
    }

    const supabase = getSupabaseAdminClient()

    const normalizedPhones = parsedRows
      .map((row) => normalizeWhatsAppNumber(row.phone))
      .filter(Boolean) as string[]

    const uniqueNormalizedPhones = Array.from(new Set(normalizedPhones))

    const { data: existingRecipients, error: existingRecipientsError } =
      await supabase
        .from('whatsapp_outreach_recipients')
        .select('normalized_phone, template_name, status')
        .in('normalized_phone', uniqueNormalizedPhones)
        .eq('template_name', templateName)
        .in('status', ['ready', 'sent'])

    if (existingRecipientsError) {
      console.error(
        'WHATSAPP_OUTREACH_EXISTING_LOOKUP_ERROR:',
        existingRecipientsError
      )

      return {
        ok: false,
        error: 'Failed to check existing contacted numbers.',
      }
    }

    const alreadyContactedSet = new Set(
      (existingRecipients || []).map((row) => row.normalized_phone)
    )

    const seenInBatch = new Set<string>()
    const previewRows: OutreachPreviewRow[] = []

    let readyCount = 0
    let skippedCount = 0
    let invalidCount = 0
    let duplicateInBatchCount = 0
    let alreadyContactedCount = 0

    for (const row of parsedRows) {
      const normalizedPhone = normalizeWhatsAppNumber(row.phone)

      let status: 'ready' | 'skipped' = 'ready'
      let skippedReason: string | null = null

      if (!normalizedPhone || !isValidEgyptianWhatsAppNumber(normalizedPhone)) {
        status = 'skipped'
        skippedReason = 'invalid_phone'
        invalidCount += 1
      } else if (seenInBatch.has(normalizedPhone)) {
        status = 'skipped'
        skippedReason = 'duplicate_in_current_batch'
        duplicateInBatchCount += 1
      } else if (alreadyContactedSet.has(normalizedPhone)) {
        status = 'skipped'
        skippedReason = 'already_contacted_before'
        alreadyContactedCount += 1
      }

      if (normalizedPhone) {
        seenInBatch.add(normalizedPhone)
      }

      if (status === 'ready') {
        readyCount += 1
      } else {
        skippedCount += 1
      }

      previewRows.push({
        rowNumber: row.rowNumber,
        phone: row.phone,
        normalizedPhone,
        ownerName: row.ownerName,
        areaName: row.areaName,
        areaSlug: row.areaSlug,
        status,
        skippedReason,
      })
    }

    const { data: campaign, error: campaignInsertError } = await supabase
      .from('whatsapp_outreach_campaigns')
      .insert({
        name: campaignName,
        campaign_type: 'owner_onboarding',
        template_name: templateName,
        template_language: templateLanguage,
        status: 'previewed',
        total_rows: parsedRows.length,
        ready_count: readyCount,
        skipped_count: skippedCount,
        failed_count: 0,
        sent_count: 0,
      })
      .select('id')
      .single()

    if (campaignInsertError || !campaign) {
      console.error(
        'WHATSAPP_OUTREACH_CAMPAIGN_INSERT_ERROR:',
        campaignInsertError
      )

      return {
        ok: false,
        error: 'Failed to create campaign.',
      }
    }

    const recipientsPayload = parsedRows.map((row) => {
      const previewRow = previewRows.find(
        (item) => item.rowNumber === row.rowNumber
      )

      const normalizedPhone = previewRow?.normalizedPhone

      const bodyVariables =
        previewRow?.status === 'ready'
          ? [row.ownerName || 'صاحب العقار', row.areaName || 'منطقتك']
          : []

      const buttonVariables =
        previewRow?.status === 'ready' ? [row.areaSlug || ''] : []

      return {
        campaign_id: campaign.id,
        phone: row.phone,
        normalized_phone: normalizedPhone || row.phone,
        owner_name: row.ownerName,
        area_name: row.areaName,
        area_slug: row.areaSlug,
        contact_type: 'owner',
        template_name: templateName,
        template_language: templateLanguage,
        body_variables: bodyVariables,
        button_variables: buttonVariables,
        status: previewRow?.status || 'skipped',
        skipped_reason: previewRow?.skippedReason || null,
        raw_row: row.rawRow,
      }
    })

    const { error: recipientsInsertError } = await supabase
      .from('whatsapp_outreach_recipients')
      .insert(recipientsPayload)

    if (recipientsInsertError) {
      console.error(
        'WHATSAPP_OUTREACH_RECIPIENTS_INSERT_ERROR:',
        recipientsInsertError
      )

      return {
        ok: false,
        error:
          recipientsInsertError.message ||
          'Failed to save campaign recipients.',
      }
    }

    revalidatePath('/admin/whatsapp/outreach')

    return {
      ok: true,
      campaignId: campaign.id,
      summary: {
        totalRows: parsedRows.length,
        readyCount,
        skippedCount,
        invalidCount,
        duplicateInBatchCount,
        alreadyContactedCount,
      },
      rows: previewRows,
    }
  } catch (error) {
    console.error('WHATSAPP_OUTREACH_PREVIEW_ACTION_ERROR:', error)

    return {
      ok: false,
      error: 'Unexpected error.',
    }
  }
}