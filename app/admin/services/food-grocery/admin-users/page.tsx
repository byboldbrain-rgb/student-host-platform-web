import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireFoodGroceryPageAccess,
  isFoodSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import FoodAdminUsersManager from './FoodAdminUsersManager'

type FoodAdminUser = {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  is_active: boolean
  created_at?: string | null
}

type RestaurantOption = {
  id: number
  name_en: string
  name_ar?: string | null
}

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') return 'Admin'
  if (possibleName.includes('@')) return possibleName.split('@')[0]
  return possibleName
}

function BrandLogo() {
  return (
    <img
      src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
      alt="Navienty"
      className="h-auto w-[120px] object-contain md:w-[145px]"
    />
  )
}

export default async function FoodAdminUsersPage() {
  const adminContext = await requireFoodGroceryPageAccess()
  const admin = adminContext.admin

  if (!isFoodSuperAdmin(admin)) {
    throw new Error('Only Food Super Admin can access this page.')
  }

  const supabase = await createClient()
  const adminName = getAdminDisplayName(admin)

  const [usersRes, providersRes] = await Promise.all([
    supabase
      .from('admin_users')
      .select('id, email, full_name, role, department, is_active, created_at')
      .eq('department', 'food_grocery')
      .order('created_at', { ascending: false }),

    supabase
      .from('service_providers')
      .select(`
        id,
        name_en,
        name_ar,
        service_categories!service_providers_category_id_fkey (
          slug
        )
      `)
      .order('name_en', { ascending: true }),
  ])

  if (usersRes.error) {
    throw new Error(usersRes.error.message)
  }

  if (providersRes.error) {
    throw new Error(providersRes.error.message)
  }

  const users = (usersRes.data || []) as FoodAdminUser[]

  const restaurantOptions = ((providersRes.data || []) as any[])
    .filter(
      (provider) => provider.service_categories?.slug === 'restaurants'
    )
    .map(
      (provider): RestaurantOption => ({
        id: Number(provider.id),
        name_en: provider.name_en || '',
        name_ar: provider.name_ar || null,
      })
    )

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-700">
      <header className="z-30 border-b border-gray-300 bg-[#f5f7f9]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/food-grocery" className="flex items-center">
              <BrandLogo />
            </Link>

            <div className="hidden md:block">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Welcome back
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                {adminName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/services/food-grocery"
              className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
            >
              Back to Food Dashboard
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        <FoodAdminUsersManager
          initialUsers={users}
          restaurantOptions={restaurantOptions}
        />
      </section>
    </main>
  )
}