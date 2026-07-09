import { NextRequest, NextResponse } from 'next/server'
import { sendMessengerText } from '@/src/lib/messenger/send-message'
import { getMessengerSupabaseAdminClient } from '@/src/lib/messenger/supabase'

export const runtime = 'nodejs'

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

  await upsertSession({
    psid: params.psid,
    pageId: params.pageId,
    userType: params.userType,
    step: params.userType === 'student' ? 'area_selected' : 'owner_area_selected',
    cityId: session?.city_id ?? null,
    universityId: null,
    areaId: params.areaId,
    lastPayload: params.payload,
    lastMessageText: params.messageText ?? null,
  })

  if (params.userType === 'student') {
    await sendMessengerText(
      params.psid,
      'تمام ✅\nتم اختيار المنطقة.\n\nالخطوة الجاية هنجهزلك لينك الشقق المناسبة.'
    )
    return
  }

  await sendMessengerText(
    params.psid,
    'تمام يا فندم ✅\nتم اختيار المنطقة.\n\nالخطوة الجاية هنجهزلك لينك إضافة السكن.'
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
      universityId: null,
      areaId: null,
      lastPayload: payload,
      lastMessageText: messageText,
    })

    await sendMessengerText(psid, 'تمام، فريق Navienty هيتابع معاك في أقرب وقت 👌')
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