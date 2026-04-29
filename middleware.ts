import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function getFoodEditorAllowedPath(
  supabase: ReturnType<typeof createServerClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'food_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_id) {
    return null
  }

  return `/admin/services/food-grocery/${scope.reference_id}`
}

async function getUniversitySuppliesEditorAllowedPath(
  supabase: ReturnType<typeof createServerClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'university_supplies_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_id) {
    return null
  }

  return `/admin/services/university-supplies/${scope.reference_id}`
}

async function getStudentActivitiesEditorAllowedPath(
  supabase: ReturnType<typeof createServerClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'student_activities_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_uuid) {
    return null
  }

  return `/admin/services/student-activities/${scope.reference_uuid}`
}

async function getStudentActivitiesReceiverAllowedPath(
  supabase: ReturnType<typeof createServerClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'student_activities_receiver')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_uuid) {
    return null
  }

  return `/admin/services/student-activities/${scope.reference_uuid}/applications`
}

async function getDefaultAdminRoute(
  supabase: ReturnType<typeof createServerClient>,
  admin: {
    id: string
    role?: string | null
    department?: string | null
    owner_id?: string | null
  }
) {
  if (admin.role === 'property_owner') {
    return admin.owner_id ? '/admin/owners' : '/admin/unauthorized'
  }

  if (admin.role === 'super_admin') {
    return '/admin'
  }

  if (admin.role === 'AR') {
    return '/admin/finance/deposit-requests'
  }

  if (admin.role === 'AP') {
    return '/admin/finance/owner-settlements'
  }

  if (admin.role === 'properties_super_admin') {
    return '/admin/properties'
  }

  if (admin.role === 'property_adder') {
    return '/admin/properties/new'
  }

  if (admin.role === 'property_editor') {
    return '/admin/properties'
  }

  if (admin.role === 'property_receiver') {
    return '/admin/properties/booking-requests'
  }

  if (admin.role === 'food_super_admin') {
    return '/admin/services/food-grocery'
  }

  if (admin.role === 'food_adder') {
    return '/admin/services/food-grocery/new'
  }

  if (admin.role === 'food_editor') {
    const allowedPath = await getFoodEditorAllowedPath(supabase, admin.id)
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'food_receiver') {
    return '/admin/services/food-grocery/orders'
  }

  if (admin.role === 'university_supplies_super_admin') {
    return '/admin/services/university-supplies'
  }

  if (admin.role === 'university_supplies_adder') {
    return '/admin/services/university-supplies/new'
  }

  if (admin.role === 'university_supplies_editor') {
    const allowedPath = await getUniversitySuppliesEditorAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'university_supplies_receiver') {
    return '/admin/services/university-supplies/orders'
  }

  if (admin.role === 'health_super_admin') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_adder') {
    return '/admin/services/health/doctors/new'
  }

  if (admin.role === 'health_editor') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_receiver') {
    return '/admin/services/health'
  }

  if (admin.role === 'student_activities_super_admin') {
    return '/admin/services/student-activities'
  }

  if (admin.role === 'student_activities_adder') {
    return '/admin/services/student-activities/new'
  }

  if (admin.role === 'student_activities_editor') {
    const allowedPath = await getStudentActivitiesEditorAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'student_activities_receiver') {
    const allowedPath = await getStudentActivitiesReceiverAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'community_super_admin') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_editor') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_hr') {
    return '/admin/community/join-requests'
  }

  if (admin.department === 'student_activities') {
    return '/admin/services/student-activities'
  }

  if (admin.department === 'health') {
    return '/admin/services/health'
  }

  if (admin.department === 'food_grocery') {
    return '/admin/services/food-grocery'
  }

  if (admin.department === 'university_supplies') {
    return '/admin/services/university-supplies'
  }

  if (admin.department === 'community') {
    return '/admin/community/posts'
  }

  if (admin.department === 'services') {
    return '/admin/services'
  }

  if (admin.department === 'career') {
    return '/admin/career'
  }

  if (admin.department === 'properties') {
    return '/admin/properties'
  }

  return '/admin/unauthorized'
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLoginRoute = pathname === '/admin/login'
  const isUnauthorizedRoute = pathname === '/admin/unauthorized'
  const isAdminChangePasswordRoute =
    pathname === '/admin/change-password' ||
    pathname.startsWith('/admin/change-password/')

  const isUserProtectedRoute = pathname === '/account'
  const isUserGuestOnlyRoute = pathname === '/login' || pathname === '/signup'

  if (!isAdminRoute) {
    if (isUserProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isUserGuestOnlyRoute && user) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, is_active, role')
        .eq('id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      const url = request.nextUrl.clone()
      url.pathname = adminUser ? '/admin' : '/account'
      return NextResponse.redirect(url)
    }

    return response
  }

  if (!user && !isAdminLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (!user) {
    return response
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role, department, is_active, owner_id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!adminUser) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/unauthorized'
    return NextResponse.redirect(url)
  }

  const defaultRoute = await getDefaultAdminRoute(supabase, adminUser)

  if (isAdminLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = defaultRoute
    return NextResponse.redirect(url)
  }

  if (isUnauthorizedRoute || isAdminChangePasswordRoute) {
    return response
  }

  if (adminUser.role === 'property_owner') {
    const allowedPath = '/admin/owners'
    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!adminUser.owner_id || !isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    return response
  }

  if (adminUser.role === 'AR') {
    const allowedPath = '/admin/finance/deposit-requests'
    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    return response
  }

  if (adminUser.role === 'AP') {
    const allowedPath = '/admin/finance/owner-settlements'
    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    return response
  }

  if (adminUser.role === 'food_adder') {
    const allowedPath = '/admin/services/food-grocery/new'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'food_receiver') {
    const allowedPath = '/admin/services/food-grocery/orders'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'food_editor') {
    const allowedPath = await getFoodEditorAllowedPath(supabase, adminUser.id)

    if (!allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'university_supplies_adder') {
    const allowedPath = '/admin/services/university-supplies/new'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'university_supplies_receiver') {
    const allowedPath = '/admin/services/university-supplies/orders'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'university_supplies_editor') {
    const allowedPath = await getUniversitySuppliesEditorAllowedPath(
      supabase,
      adminUser.id
    )

    if (!allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'health_adder') {
    const allowedPath = '/admin/services/health/doctors/new'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'student_activities_adder') {
    const allowedPath = '/admin/services/student-activities/new'

    if (pathname !== allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'student_activities_editor') {
    const allowedPath = await getStudentActivitiesEditorAllowedPath(
      supabase,
      adminUser.id
    )

    if (!allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'student_activities_receiver') {
    const allowedPath = await getStudentActivitiesReceiverAllowedPath(
      supabase,
      adminUser.id
    )

    if (!allowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }

    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'community_editor') {
    const allowedPath = '/admin/community/posts'
    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'community_hr') {
    const allowedPath = '/admin/community/join-requests'
    const isAllowedPath =
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  if (adminUser.role === 'community_super_admin') {
    const isAllowedPath = pathname.startsWith('/admin/community')

    if (!isAllowedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/account', '/login', '/signup'],
}