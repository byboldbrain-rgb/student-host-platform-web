import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

const ALLOWED_ROLES = new Set([
  'food_super_admin',
  'food_adder',
  'food_editor',
  'food_receiver',
])

function getServiceRoleClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function getFoodEditorRoleId(adminSupabase: ReturnType<typeof getServiceRoleClient>) {
  const { data, error } = await adminSupabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'food_editor')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.id) {
    throw new Error('food_editor role was not found in admin_roles')
  }

  return Number(data.id)
}

async function ensureProviderExists(
  adminSupabase: ReturnType<typeof getServiceRoleClient>,
  providerId: number
) {
  const { data, error } = await adminSupabase
    .from('service_providers')
    .select(`
      id,
      service_categories!service_providers_category_id_fkey (
        slug
      )
    `)
    .eq('id', providerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Selected restaurant was not found')
  }

  if ((data as any)?.service_categories?.slug !== 'restaurants') {
    throw new Error('Selected provider is not a restaurant')
  }
}

async function getOrCreateFoodProviderScope(
  adminSupabase: ReturnType<typeof getServiceRoleClient>,
  providerId: number
) {
  const scopeCode = `food_provider_${providerId}`

  const { data: existingScope, error: existingScopeError } = await adminSupabase
    .from('admin_scopes')
    .select('id')
    .eq('code', scopeCode)
    .maybeSingle()

  if (existingScopeError) {
    throw new Error(existingScopeError.message)
  }

  if (existingScope?.id) {
    return Number(existingScope.id)
  }

  const { data: createdScope, error: createScopeError } = await adminSupabase
    .from('admin_scopes')
    .insert({
      code: scopeCode,
      name_en: `Food Provider ${providerId}`,
      name_ar: `مزود طعام ${providerId}`,
      scope_type: 'service_category',
      reference_id: providerId,
    })
    .select('id')
    .maybeSingle()

  if (createScopeError) {
    throw new Error(createScopeError.message)
  }

  if (!createdScope?.id) {
    throw new Error('Failed to create provider scope')
  }

  return Number(createdScope.id)
}

async function deactivateFoodEditorAssignments(
  adminSupabase: ReturnType<typeof getServiceRoleClient>,
  adminUserId: string
) {
  const roleId = await getFoodEditorRoleId(adminSupabase)

  const { error } = await adminSupabase
    .from('admin_role_assignments')
    .update({ is_active: false })
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleId)
    .eq('is_active', true)

  if (error) {
    throw new Error(error.message)
  }
}

async function ensureFoodEditorAssignment(params: {
  adminSupabase: ReturnType<typeof getServiceRoleClient>
  adminUserId: string
  providerId: number
  assignedBy?: string | null
}) {
  const { adminSupabase, adminUserId, providerId, assignedBy } = params

  await ensureProviderExists(adminSupabase, providerId)

  const roleId = await getFoodEditorRoleId(adminSupabase)
  const scopeId = await getOrCreateFoodProviderScope(adminSupabase, providerId)

  await deactivateFoodEditorAssignments(adminSupabase, adminUserId)

  const { error } = await adminSupabase
    .from('admin_role_assignments')
    .insert({
      admin_user_id: adminUserId,
      role_id: roleId,
      scope_id: scopeId,
      assigned_by: assignedBy || null,
      is_active: true,
    })

  if (error) {
    throw new Error(error.message)
  }
}

export async function POST(req: Request) {
  try {
    const adminContext = await getCurrentAdminContext()

    if (!adminContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isFoodSuperAdmin(adminContext.admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '').trim()
    const fullName = String(body?.full_name || '').trim()
    const role = String(body?.role || '').trim()
    const providerId =
      body?.provider_id == null || body?.provider_id === ''
        ? null
        : Number(body.provider_id)

    if (!email || !password || !fullName || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields' },
        { status: 400 }
      )
    }

    if (role === 'food_editor' && (!providerId || Number.isNaN(providerId))) {
      return NextResponse.json(
        { error: 'Restaurant is required for food_editor' },
        { status: 400 }
      )
    }

    const adminSupabase = getServiceRoleClient()

    const { data: createdUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

    if (createUserError) {
      return NextResponse.json(
        { error: createUserError.message },
        { status: 500 }
      )
    }

    const authUserId = createdUser.user?.id

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Auth user creation failed' },
        { status: 500 }
      )
    }

    const { error: insertAdminError } = await adminSupabase
      .from('admin_users')
      .insert({
        id: authUserId,
        email,
        full_name: fullName,
        role,
        department: 'food_grocery',
        is_active: true,
        broker_id: null,
      })

    if (insertAdminError) {
      await adminSupabase.auth.admin.deleteUser(authUserId)

      return NextResponse.json(
        { error: insertAdminError.message },
        { status: 500 }
      )
    }

    try {
      if (role === 'food_editor' && providerId) {
        await ensureFoodEditorAssignment({
          adminSupabase,
          adminUserId: authUserId,
          providerId,
          assignedBy: adminContext.admin.id,
        })
      }
    } catch (assignmentError: any) {
      await adminSupabase.from('admin_users').delete().eq('id', authUserId)
      await adminSupabase.auth.admin.deleteUser(authUserId)

      return NextResponse.json(
        { error: assignmentError?.message || 'Failed to assign food editor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}