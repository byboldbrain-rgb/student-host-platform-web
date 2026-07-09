import { NextRequest, NextResponse } from 'next/server'
import { sendMessengerText } from '@/src/lib/messenger/send-message'

export const runtime = 'nodejs'

type MessengerEvent = {
  sender?: {
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

async function handleMessengerEvent(event: MessengerEvent) {
  if (!isIncomingUserMessage(event)) {
    return
  }

  const psid = event.sender?.id

  if (!psid) {
    return
  }

  const payload = event.message?.quick_reply?.payload || event.postback?.payload

  if (payload === 'STUDENT_START') {
    await sendMessengerText(psid, 'تمام 👌\nهنبدأ نساعدك تلاقي سكن مناسب.\n\nالخطوة الجاية هنخليك تختار المدينة.')
    return
  }

  if (payload === 'OWNER_START') {
    await sendMessengerText(psid, 'أهلاً بحضرتك 👋\nهنساعدك تضيف السكن بتاعك على Navienty.\n\nالخطوة الجاية هنخليك تختار المدينة الموجود فيها السكن.')
    return
  }

  if (payload === 'SUPPORT') {
    await sendMessengerText(psid, 'تمام، فريق Navienty هيتابع معاك في أقرب وقت 👌')
    return
  }

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