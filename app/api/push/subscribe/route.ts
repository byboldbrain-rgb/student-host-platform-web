import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export const runtime = 'nodejs'

type PushSubscriptionPayload = {
  endpoint?: string
  anonymous_alert_token?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

function sanitizeAnonymousAlertToken(value?: string | null) {
  const token = String(value || '').trim()

  if (!token) return null

  // UUID أو token آمن عام
  if (!/^[a-zA-Z0-9_-]{12,120}$/.test(token)) {
    return null
  }

  return token
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = (await request.json()) as PushSubscriptionPayload

    const endpoint = body.endpoint?.trim()
    const p256dh = body.keys?.p256dh?.trim()
    const auth = body.keys?.auth?.trim()
    const anonymousAlertToken = sanitizeAnonymousAlertToken(
      body.anonymous_alert_token
    )

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid push subscription.',
        },
        { status: 400 }
      )
    }

    if (!user && !anonymousAlertToken) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Missing anonymous alert token. Login or provide anonymous token.',
        },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || null

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user?.id ?? null,
        anonymous_alert_token: user ? null : anonymousAlertToken,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'endpoint',
      }
    )

    if (error) {
      console.error('Failed to save push subscription:', error)

      return NextResponse.json(
        {
          ok: false,
          message: 'Failed to save push subscription.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: user
        ? 'Push subscription saved successfully for logged in user.'
        : 'Push subscription saved successfully for guest user.',
    })
  } catch (error) {
    console.error('Unexpected push subscription error:', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}