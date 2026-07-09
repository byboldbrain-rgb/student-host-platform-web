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

async function upsertSession(params: {
  psid: string
  pageId?: string | null
  userType?: BotUserType | null
  step: string
  cityId?: string | null
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
    step: 'select_university',
    cityId: params.cityId,
    lastPayload: params.payload,
    lastMessageText: params.messageText ?? null,
  })

  await sendMessengerText(
    params.psid,
    'تمام ✅\nتم اختيار المدينة.\n\nالخطوة الجاية هنخليك تختار الجامعة.'
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