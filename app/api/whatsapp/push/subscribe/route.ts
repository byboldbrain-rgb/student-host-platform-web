import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/src/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
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

    console.log('ADMIN_PUSH_SUBSCRIBE_REQUEST:', {
      hasEndpoint: Boolean(endpoint),
      endpointStart: endpoint ? String(endpoint).slice(0, 60) : null,
      hasP256dh: Boolean(p256dh),
      hasAuth: Boolean(auth),
      userAgent: req.headers.get('user-agent'),
    })

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          ok: false,
          step: 'validate_subscription_payload',
          error: 'Invalid push subscription payload.',
          debug: {
            hasEndpoint: Boolean(endpoint),
            hasP256dh: Boolean(p256dh),
            hasAuth: Boolean(auth),
          },
        },
        { status: 400 }
      )
    }

    const authSupabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser()

    if (userError || !user) {
      console.error('ADMIN_PUSH_SUBSCRIBE_AUTH_ERROR:', userError)

      return NextResponse.json(
        {
          ok: false,
          step: 'get_authenticated_user',
          error:
            'You must be logged in as an admin before enabling notifications.',
          debug: {
            message: userError?.message ?? null,
          },
        },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdminClient()

    const { data: adminUser, error: adminUserError } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminUserError || !adminUser) {
      console.error('ADMIN_PUSH_SUBSCRIBE_ADMIN_LOOKUP_ERROR:', adminUserError)

      return NextResponse.json(
        {
          ok: false,
          step: 'lookup_admin_user',
          error: 'This account is not authorized as an active admin.',
          debug: {
            authUserId: user.id,
            message: adminUserError?.message ?? null,
            code: adminUserError?.code ?? null,
          },
        },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()
    const userAgent = req.headers.get('user-agent')

    const { data: existingRows, error: selectError } = await supabase
      .from('admin_push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .limit(1)

    if (selectError) {
      console.error('ADMIN_PUSH_SUBSCRIBE_SELECT_ERROR:', selectError)

      return NextResponse.json(
        {
          ok: false,
          step: 'select_existing_subscription',
          error: selectError.message,
          debug: {
            code: selectError.code,
            message: selectError.message,
            details: selectError.details,
            hint: selectError.hint,
          },
        },
        { status: 500 }
      )
    }

    const existingId = existingRows?.[0]?.id ?? null

    if (existingId) {
      const { error: updateError } = await supabase
        .from('admin_push_subscriptions')
        .update({
          admin_user_id: adminUser.id,
          p256dh,
          auth,
          user_agent: userAgent,
          is_active: true,
          updated_at: now,
        })
        .eq('id', existingId)

      if (updateError) {
        console.error('ADMIN_PUSH_SUBSCRIBE_UPDATE_ERROR:', updateError)

        return NextResponse.json(
          {
            ok: false,
            step: 'update_existing_subscription',
            error: updateError.message,
            debug: {
              code: updateError.code,
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
            },
          },
          { status: 500 }
        )
      }

      console.log('ADMIN_PUSH_SUBSCRIPTION_UPDATED:', {
        id: existingId,
        adminUserId: adminUser.id,
      })

      return NextResponse.json({
        ok: true,
        mode: 'updated',
        id: existingId,
      })
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from('admin_push_subscriptions')
      .insert({
        admin_user_id: adminUser.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('ADMIN_PUSH_SUBSCRIBE_INSERT_ERROR:', insertError)

      return NextResponse.json(
        {
          ok: false,
          step: 'insert_new_subscription',
          error: insertError.message,
          debug: {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          },
        },
        { status: 500 }
      )
    }

    console.log('ADMIN_PUSH_SUBSCRIPTION_INSERTED:', {
      id: insertedRow?.id ?? null,
      adminUserId: adminUser.id,
    })

    return NextResponse.json({
      ok: true,
      mode: 'inserted',
      id: insertedRow?.id ?? null,
    })
  } catch (error: any) {
    console.error('ADMIN_PUSH_SUBSCRIBE_FATAL_ERROR:', error)

    return NextResponse.json(
      {
        ok: false,
        step: 'fatal',
        error: error?.message || 'Unexpected error.',
        debug: {
          name: error?.name,
          message: error?.message,
        },
      },
      { status: 500 }
    )
  }
}