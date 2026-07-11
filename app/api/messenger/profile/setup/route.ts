import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GRAPH_API_VERSION = 'v20.0'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get('secret')

  const expectedSecret = process.env.MESSENGER_PROFILE_SETUP_SECRET
  const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing MESSENGER_PROFILE_SETUP_SECRET' },
      { status: 500 }
    )
  }

  if (!pageAccessToken) {
    return NextResponse.json(
      { ok: false, error: 'Missing MESSENGER_PAGE_ACCESS_TOKEN' },
      { status: 500 }
    )
  }

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messenger_profile?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        get_started: {
          payload: 'GET_STARTED',
        },
        greeting: [
          {
            locale: 'default',
            text: 'أهلاً بيك في Navienty \nاختار المناسب ليك وهنساعدك فورًا',
          },
        ],
        ice_breakers: [
          {
            question: 'طالب بدور على سكن',
            payload: 'STUDENT_START',
          },
          {
            question: 'مالك عندي سكن',
            payload: 'OWNER_START',
          },
          {
            question: 'التواصل مع الدعم',
            payload: 'SUPPORT',
          },
        ],
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result,
      },
      { status: response.status }
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'Messenger profile setup completed',
    result,
  })
}