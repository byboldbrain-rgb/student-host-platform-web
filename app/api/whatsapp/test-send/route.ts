import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const to = searchParams.get('to')
    const secret = searchParams.get('secret')

    if (secret !== process.env.WHATSAPP_TEST_SEND_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to" phone number' },
        { status: 400 }
      )
    }

    const accessToken = process.env.META_WA_ACCESS_TOKEN
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { ok: false, error: 'Missing WhatsApp environment variables' },
        { status: 500 }
      )
    }

    const res = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: 'Test message from Navienty WhatsApp API ✅',
          },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('WHATSAPP_TEST_SEND_ERROR:', data)

      return NextResponse.json(
        { ok: false, error: data },
        { status: res.status }
      )
    }

    console.log('WHATSAPP_TEST_SEND_SUCCESS:', data)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error('WHATSAPP_TEST_SEND_EXCEPTION:', error)

    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}