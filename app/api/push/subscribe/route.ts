import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export const runtime = 'nodejs'

type PushSubscriptionPayload = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          message: 'You must be logged in to enable notifications.',
        },
        { status: 401 }
      )
    }

    const body = (await request.json()) as PushSubscriptionPayload

    const endpoint = body.endpoint?.trim()
    const p256dh = body.keys?.p256dh?.trim()
    const auth = body.keys?.auth?.trim()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid push subscription.',
        },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || null

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
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
      message: 'Push subscription saved successfully.',
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