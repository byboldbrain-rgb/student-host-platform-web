import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type FinanceAdminContext = {
  userId: string
  admin: {
    id: string
    email: string
    full_name: string
    role: string
    is_active: boolean
  }
  sessionClient: SupabaseClient
  adminClient: SupabaseClient
}

const FINANCE_ROLES = new Set([
  'admin',
  'super_admin',
  'accountant',
])

export function isFinanceRole(role: string | null | undefined): boolean {
  return FINANCE_ROLES.has(String(role || '').trim().toLowerCase())
}

function getSupabaseEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  return { supabaseUrl, anonKey, serviceRoleKey }
}

export async function getFinanceAdminContext(): Promise<FinanceAdminContext | null> {
  const { supabaseUrl, anonKey, serviceRoleKey } = getSupabaseEnvironment()
  const cookieStore = await cookies()

  const sessionClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always mutate cookies. Middleware can refresh them.
        }
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser()

  if (userError || !user) {
    return null
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { data: admin, error: adminError } = await adminClient
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError) {
    throw new Error(`Failed to load finance admin: ${adminError.message}`)
  }

  if (!admin || !isFinanceRole(admin.role)) {
    return null
  }

  return {
    userId: user.id,
    admin,
    sessionClient,
    adminClient,
  }
}

export function canPostFinanceTransactions(role: string): boolean {
  return ['admin', 'super_admin', 'accountant'].includes(
    role.trim().toLowerCase(),
  )
}

export function canApproveFinanceTransactions(role: string): boolean {
  return canPostFinanceTransactions(role)
}
