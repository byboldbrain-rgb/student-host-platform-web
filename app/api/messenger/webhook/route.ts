import { NextRequest, NextResponse } from 'next/server'
import { sendMessengerText } from '@/src/lib/messenger/send-message'
import { getMessengerSupabaseAdminClient } from '@/src/lib/messenger/supabase'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://navienty.com'

type MessengerEvent = {
  sender?: {
    id?: string
  }
  recipient?: {
    id?: string
  }
  message?: {
    text?: string
    is_echo?: boolean
    quick_reply?: {
      payload?: string
    }
  }
  postback?: {
    payload?: string
  }
}

type BotUserType = 'student' | 'owner' | 'support'

type CityRow = {
  id: string
  name_ar: string | null
  name_en: string | null
  slug: string | null
}

type PropertyAreaRow = {
  id: string
  name_ar: string | null
  name_en: string | null
  slug: string | null
}

type PropertyAreaResult = {
  area_id: string | null
  property_areas: PropertyAreaRow | PropertyAreaRow[] | null
}

type SakanSeoPageRow = {
  path: string
  entity_name_ar: string | null
  entity_name_en: string | null
  published_properties_count: number | null
}

function isIncomingUserMessage(event: MessengerEvent) {
  const psid = event.sender?.id

  if (!psid) {
    return false
  }

  if (event.message?.is_echo) {
    return false
  }

  return Boolean(event.message || event.postback)
}

function getPayload(event: MessengerEvent) {
  return event.message?.quick_reply?.payload || event.postback?.payload || null
}

function trimMessengerTitle(title: string) {
  const cleanTitle = title.trim()

  if (cleanTitle.length <= 20) {
    return cleanTitle
  }

  return `${cleanTitle.slice(0, 19)}…`
}

function getAreaFromResult(row: PropertyAreaResult) {
  if (Array.isArray(row.property_areas)) {
    return row.property_areas[0] ?? null
  }

  return row.property_areas ?? null
}

function withBotTracking(url: string) {
  const parsedUrl = new URL(url)

  parsedUrl.searchParams.set('lang', 'ar')
  parsedUrl.searchParams.set('currency', 'EGP')
  parsedUrl.searchParams.set('utm_source', 'messenger')
  parsedUrl.searchParams.set('utm_medium', 'bot')
  parsedUrl.searchParams.set('utm_campaign', 'student_area_flow')

  return parsedUrl.toString()
}

async function upsertSession(params: {
  psid: string
  pageId?: string | null
  userType?: BotUserType | null
  step: string
  cityId?: string | null
  universityId?: string | null
  areaId?: string | null
  lastPayload?: string | null
  lastMessageText?: string | null
}) {
  const supabase = getMessengerSupabaseAdminClient()

  const { error } = await supabase.from('messenger_bot_sessions').upsert(
    {
      psid: params.psid,
      page_id: params.pageId ?? null,
      user_type: params.userType ?? null,
      step: params.step,
      city_id: params.cityId ?? null,
      university_id: params.universityId ?? null,
      area_id: params.areaId ?? null,
      last_payload: params.lastPayload ?? null,
      last_message_text: params.lastMessageText ?? null,
    },
    {
      onConflict: 'psid',
    }
  )

  if (error) {
    throw new Error(`Failed to upsert messenger session: ${error.message}`)
  }
}

async function getSession(psid: string) {
  const supabase = getMessengerSupabaseAdminClient()

  const { data, error } = await supabase
    .from('messenger_bot_sessions')
    .select('*')
    .eq('psid', psid)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to get messenger session: ${error.message}`)
  }

  return data
}

async function createMessengerLead(params: {
  psid: string
  pageId?: string | null
  userType: 'student' | 'owner' | 'support'
  cityId?: string | null
  areaId?: string | null
  finalUrl?: string | null
  leadStatus: 'new' | 'sent_to_website' | 'sent_to_owner_form' | 'support_needed' | 'closed'
}) {
  const supabase = getMessengerSupabaseAdminClient()

  const { error } = await supabase.from('messenger_bot_leads').insert({
    psid: params.psid,
    page_id: params.pageId ?? null,
    user_type: params.userType,
    city_id: params.cityId ?? null,
    university_id: null,
    area_id: params.areaId ?? null,
    final_url: params.finalUrl ?? null,
    lead_status: params.leadStatus,
  })

  if (error) {
    throw new Error(`Failed to create messenger lead: ${error.message}`)
  }
}

async function sendMainMenu(psid: string) {
  await sendMessengerText(psid, 'أهلاً بيك في Navienty 👋\nاختار المناسب ليك:', {
    quickReplies: [
      {
        content_type: 'text',
        title: 'طالب بدور على سكن',
        payload: 'STUDENT_START',
      },
      {
        content_type: 'text',
        title: 'مالك عندي سكن',
        payload: 'OWNER_START',
      },
      {
        content_type: 'text',
        title: 'التواصل مع الدعم',
        payload: 'SUPPORT',
      },
    ],
  })
}

async function sendCities(psid: string, userType: 'student' | 'owner') {
  const supabase = getMessengerSupabaseAdminClient()

  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name_ar, name_en, slug')
    .order('name_ar', { ascending: true })
    .limit(12)

  if (error) {
    throw new Error(`Failed to fetch cities: ${error.message}`)
  }

  if (!cities?.length) {
    await sendMessengerText(
      psid,
      'حاليًا مفيش مدن متاحة في النظام.\nفريق Navienty هيتابع معاك قريبًا.'
    )
    return
  }

  const prefix = userType === 'student' ? 'STUDENT_CITY' : 'OWNER_CITY'

  const quickReplies = (cities as CityRow[]).map((city) => ({
    content_type: 'text' as const,
    title: trimMessengerTitle(city.name_ar || city.name_en || 'مدينة'),
    payload: `${prefix}:${city.id}`,
  }))

  const message =
    userType === 'student'
      ? 'تمام 👌\nاختار المدينة اللي بتدور فيها على سكن:'
      : 'تمام يا فندم 👌\nاختار المدينة الموجود فيها السكن:'

  await sendMessengerText(psid, message, {
    quickReplies,
  })
}

async function sendAreas(params: {
  psid: string
  userType: 'student' | 'owner'
  cityId: string
}) {
  const supabase = getMessengerSupabaseAdminClient()

  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      area_id,
      property_areas (
        id,
        name_ar,
        name_en,
        slug
      )
    `
    )
    .eq('city_id', params.cityId)
    .eq('admin_status', 'published')
    .eq('is_active', true)
    .not('area_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(`Failed to fetch areas: ${error.message}`)
  }

  const uniqueAreas = new Map<string, PropertyAreaRow>()

  for (const row of (data ?? []) as PropertyAreaResult[]) {
    const area = getAreaFromResult(row)

    if (area?.id && !uniqueAreas.has(area.id)) {
      uniqueAreas.set(area.id, area)
    }
  }

  const areas = Array.from(uniqueAreas.values()).slice(0, 12)

  if (!areas.length) {
    await sendMessengerText(
      params.psid,
      params.userType === 'student'
        ? 'حاليًا مفيش مناطق فيها شقق منشورة في المدينة دي.\nجرب تختار مدينة تانية أو تواصل مع الدعم.'
        : 'حاليًا مفيش مناطق متاحة في المدينة دي.\nفريق Navienty هيتابع معاك قريبًا.'
    )
    return
  }

  const prefix = params.userType === 'student' ? 'STUDENT_AREA' : 'OWNER_AREA'

  const quickReplies = areas.map((area) => ({
    content_type: 'text' as const,
    title: trimMessengerTitle(area.name_ar || area.name_en || 'منطقة'),
    payload: `${prefix}:${area.id}`,
  }))

  const message =
    params.userType === 'student'
      ? 'تمام ✅\nاختار المنطقة اللي عاوز تسكن فيها:'
      : 'تمام ✅\nاختار المنطقة الموجود فيها السكن:'

  await sendMessengerText(params.psid, message, {
    quickReplies,
  })
}

async function getStudentAreaUrl(params: {
  cityId: string
  areaId: string
}) {
  const supabase = getMessengerSupabaseAdminClient()

  const { data: seoPage, error } = await supabase
    .from('sakan_seo_pages')
    .select('path, entity_name_ar, entity_name_en, published_properties_count')
    .eq('page_type', 'area')
    .eq('city_id', params.cityId)
    .eq('area_id', params.areaId)
    .order('published_properties_count', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch sakan SEO page: ${error.message}`)
  }

  if ((seoPage as SakanSeoPageRow | null)?.path) {
    const finalUrl = withBotTracking(`${SITE_URL}${(seoPage as SakanSeoPageRow).path}`)

    return {
      finalUrl,
      areaName:
        (seoPage as SakanSeoPageRow).entity_name_ar ||
        (seoPage as SakanSeoPageRow).entity_name_en ||
        'المنطقة المختارة',
      propertiesCount: (seoPage as SakanSeoPageRow).published_properties_count ?? null,
    }
  }

  const fallbackUrl = withBotTracking(
    `${SITE_URL}/properties/search?city_id=${encodeURIComponent(
      params.cityId
    )}&area_id=${encodeURIComponent(params.areaId)}`
  )

  return {
    finalUrl: fallbackUrl,
    areaName: 'المنطقة المختارة',
    propertiesCount: null,
  }
}

function buildOwnerAddPropertyUrl(params: {
  cityId?: string | null
  areaId?: string | null
}) {
  const url = new URL('/owners/add-property', SITE_URL)

  if (params.cityId) {
    url.searchParams.set('city_id', params.cityId)
  }

  if (params.areaId) {
    url.searchParams.set('area_id', params.areaId)
  }

  url.searchParams.set('utm_source', 'messenger')
  url.searchParams.set('utm_medium', 'bot')
  url.searchParams.set('utm_campaign', 'owner_area_flow')

  return url.toString()
}

async function handleCitySelection(params: {
  psid: string
  pageId?: string | null
  userType: 'student' | 'owner'
  cityId: string
  payload: string
  messageText?: string | null
}) {
  await upsertSession({
    psid: params.psid,
    pageId: params.pageId,
    userType: params.userType,
    step: 'select_area',
    cityId: params.cityId,
    universityId: null,
    areaId: null,
    lastPayload: params.payload,
    lastMessageText: params.messageText ?? null,
  })

  await sendAreas({
    psid: params.psid,
    userType: params.userType,
    cityId: params.cityId,
  })
}

async function handleAreaSelection(params: {
  psid: string
  pageId?: string | null
  userType: 'student' | 'owner'
  areaId: string
  payload: string
  messageText?: string | null
}) {
  const session = await getSession(params.psid)
  const cityId = session?.city_id ? String(session.city_id) : null

  await upsertSession({
    psid: params.psid,
    pageId: params.pageId,
    userType: params.userType,
    step: params.userType === 'student' ? 'sent_area_link' : 'sent_owner_form_link',
    cityId,
    universityId: null,
    areaId: params.areaId,
    lastPayload: params.payload,
    lastMessageText: params.messageText ?? null,
  })

  if (!cityId) {
    await sendMessengerText(
      params.psid,
      'حصل خطأ بسيط في حفظ المدينة.\nابدأ من جديد واختار المدينة مرة تانية 👇'
    )

    await sendMainMenu(params.psid)
    return
  }

  if (params.userType === 'student') {
    const { finalUrl, areaName, propertiesCount } = await getStudentAreaUrl({
      cityId,
      areaId: params.areaId,
    })

    await createMessengerLead({
      psid: params.psid,
      pageId: params.pageId,
      userType: 'student',
      cityId,
      areaId: params.areaId,
      finalUrl,
      leadStatus: 'sent_to_website',
    })

    const countText =
      typeof propertiesCount === 'number' && propertiesCount > 0
        ? `\nعدد الشقق المتاحة تقريبًا: ${propertiesCount}`
        : ''

    await sendMessengerText(
      params.psid,
      `تمام ✅\nدي الشقق المتاحة في ${areaName}:${countText}\n\n${finalUrl}\n\nافتح اللينك وشوف الصور والأسعار والموقع، والطالب لا يدفع أي عمولة على Navienty.`,
      {
        quickReplies: [
          {
            content_type: 'text',
            title: 'منطقة تانية',
            payload: 'STUDENT_CHANGE_AREA',
          },
          {
            content_type: 'text',
            title: 'مدينة تانية',
            payload: 'STUDENT_CHANGE_CITY',
          },
          {
            content_type: 'text',
            title: 'الدعم',
            payload: 'SUPPORT',
          },
        ],
      }
    )

    return
  }

  const ownerUrl = buildOwnerAddPropertyUrl({
    cityId,
    areaId: params.areaId,
  })

  await createMessengerLead({
    psid: params.psid,
    pageId: params.pageId,
    userType: 'owner',
    cityId,
    areaId: params.areaId,
    finalUrl: ownerUrl,
    leadStatus: 'sent_to_owner_form',
  })

  await sendMessengerText(
    params.psid,
    `تمام يا فندم ✅\nتقدر تضيف السكن من هنا:\n\n${ownerUrl}\n\nبعد الإضافة، فريق Navienty هيراجع البيانات والصور قبل النشر.`
  )
}

async function handleMessengerEvent(event: MessengerEvent) {
  if (!isIncomingUserMessage(event)) {
    return
  }

  const psid = event.sender?.id

  if (!psid) {
    return
  }

  const pageId = event.recipient?.id ?? null
  const payload = getPayload(event)
  const messageText = event.message?.text ?? null

  if (payload === 'STUDENT_START') {
    await upsertSession({
      psid,
      pageId,
      userType: 'student',
      step: 'select_city',
      cityId: null,
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await sendCities(psid, 'student')
    return
  }

  if (payload === 'OWNER_START') {
    await upsertSession({
      psid,
      pageId,
      userType: 'owner',
      step: 'select_city',
      cityId: null,
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await sendCities(psid, 'owner')
    return
  }

  if (payload === 'SUPPORT') {
    await upsertSession({
      psid,
      pageId,
      userType: 'support',
      step: 'support_needed',
      cityId: null,
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await createMessengerLead({
      psid,
      pageId,
      userType: 'support',
      leadStatus: 'support_needed',
    })

    await sendMessengerText(psid, 'تمام، فريق Navienty هيتابع معاك في أقرب وقت 👌')
    return
  }

  if (payload === 'STUDENT_CHANGE_CITY') {
    await upsertSession({
      psid,
      pageId,
      userType: 'student',
      step: 'select_city',
      cityId: null,
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await sendCities(psid, 'student')
    return
  }

  if (payload === 'STUDENT_CHANGE_AREA') {
    const session = await getSession(psid)
    const cityId = session?.city_id ? String(session.city_id) : null

    if (!cityId) {
      await sendMessengerText(psid, 'اختار المدينة الأول 👇')
      await sendCities(psid, 'student')
      return
    }

    await upsertSession({
      psid,
      pageId,
      userType: 'student',
      step: 'select_area',
      cityId,
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await sendAreas({
      psid,
      userType: 'student',
      cityId,
    })

    return
  }

  if (payload?.startsWith('STUDENT_CITY:')) {
    const cityId = payload.replace('STUDENT_CITY:', '')

    await handleCitySelection({
      psid,
      pageId,
      userType: 'student',
      cityId,
      payload,
      messageText,
    })

    return
  }

  if (payload?.startsWith('OWNER_CITY:')) {
    const cityId = payload.replace('OWNER_CITY:', '')

    await handleCitySelection({
      psid,
      pageId,
      userType: 'owner',
      cityId,
      payload,
      messageText,
    })

    return
  }

  if (payload?.startsWith('STUDENT_AREA:')) {
    const areaId = payload.replace('STUDENT_AREA:', '')

    await handleAreaSelection({
      psid,
      pageId,
      userType: 'student',
      areaId,
      payload,
      messageText,
    })

    return
  }

  if (payload?.startsWith('OWNER_AREA:')) {
    const areaId = payload.replace('OWNER_AREA:', '')

    await handleAreaSelection({
      psid,
      pageId,
      userType: 'owner',
      areaId,
      payload,
      messageText,
    })

    return
  }

  await sendMainMenu(psid)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.MESSENGER_VERIFY_TOKEN

  if (!verifyToken) {
    return new NextResponse('Missing MESSENGER_VERIFY_TOKEN', { status: 500 })
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Messenger webhook event:', JSON.stringify(body, null, 2))

    if (body.object !== 'page') {
      return new NextResponse('Not Found', { status: 404 })
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        await handleMessengerEvent(event)
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  } catch (error) {
    console.error('Messenger webhook error:', error)
    return new NextResponse('Bad Request', { status: 400 })
  }
}