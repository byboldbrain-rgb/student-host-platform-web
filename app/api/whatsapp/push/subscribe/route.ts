import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const endpoint = body?.endpoint
    const p256dh = body?.keys?.p256dh
    const auth = body?.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      console.error('ADMIN_WHATSAPP_PUSH_INVALID_SUBSCRIPTION:', {
        hasEndpoint: Boolean(endpoint),
        hasP256dh: Boolean(p256dh),
        hasAuth: Boolean(auth),
      })

      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid push subscription.',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const userAgent = req.headers.get('user-agent')
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('admin_push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent,
          is_active: true,
          updated_at: now,
        },
        {
          onConflict: 'endpoint',
        }
      )

    if (error) {
      console.error('ADMIN_WHATSAPP_PUSH_SUBSCRIBE_ERROR:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to save push subscription.',
          debug:
            process.env.NODE_ENV === 'production'
              ? undefined
              : {
                  code: error.code,
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                },
        },
        { status: 500 }
      )
    }

    console.log('ADMIN_WHATSAPP_PUSH_SUBSCRIPTION_SAVED:', {
      endpointStart: String(endpoint).slice(0, 40),
      userAgent,
    })

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error('ADMIN_WHATSAPP_PUSH_SUBSCRIBE_ROUTE_ERROR:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Unexpected error.',
      },
      { status: 500 }
    )
  }
}