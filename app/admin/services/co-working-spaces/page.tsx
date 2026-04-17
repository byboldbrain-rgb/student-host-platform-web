import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireCoworkingPageAccess,
  isCoworkingSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type CoworkingSpaceRow = {
  id: string
  name_en: string
  name_ar?: string | null
  phone?: string | null
  city_id?: string | null
  primary_university_id?: string | null
  is_active?: boolean | null
  is_featured?: boolean | null
  price_starts_from_egp?: number | null
  created_at?: string | null
  updated_at?: string | null
  cities?: {
    id?: string
    name_en?: string | null
    name_ar?: string | null
  } | null
  universities?: {
    id?: string
    name_en?: string | null
    name_ar?: string | null
  } | null
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

function formatDate(date?: string | null) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return '—'
  }
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

function getCityLabel(space: CoworkingSpaceRow) {
  return space.cities?.name_en || space.cities?.name_ar || '—'
}

function getUniversityLabel(space: CoworkingSpaceRow) {
  return space.universities?.name_en || space.universities?.name_ar || '—'
}

export default async function CoworkingSpacesDashboardPage() {
  const adminContext = await requireCoworkingPageAccess()
  const admin = adminContext.admin
  const adminName = getAdminDisplayName(admin)

  async function handleLogout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coworking_spaces')
    .select(`
      id,
      name_en,
      name_ar,
      phone,
      city_id,
      primary_university_id,
      is_active,
      is_featured,
      price_starts_from_egp,
      created_at,
      updated_at,
      cities (
        id,
        name_en,
        name_ar
      ),
      universities!coworking_spaces_primary_university_id_fkey (
        id,
        name_en,
        name_ar
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const spaces = (data || []) as CoworkingSpaceRow[]

  const totalSpaces = spaces.length
  const activeSpaces = spaces.filter((item) => item.is_active !== false).length
  const featuredSpaces = spaces.filter((item) => item.is_featured === true).length
  const inactiveSpaces = spaces.filter((item) => item.is_active === false).length

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-gray-700">
      <header className="z-30 border-b border-gray-300 bg-[#f5f7f9]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/co-working-spaces" className="flex items-center">
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
            {isCoworkingSuperAdmin(admin) ? (
              <Link
                href="/admin/services/co-working-spaces/admin-users"
                className="hidden rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:inline-flex"
              >
                Manage Staff
              </Link>
            ) : null}

            <Link
              href="/admin/services/co-working-spaces/booking-requests"
              className="rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-medium text-[#344054] transition hover:bg-[#f9fafb]"
            >
              Booking Requests
            </Link>

            <Link
              href="/admin/services/co-working-spaces/new"
              className="rounded-full bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1849a9]"
            >
              + Add Space
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 md:px-6 md:pt-8">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Total Spaces
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">
              {totalSpaces}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Active
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">
              {activeSpaces}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Featured
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">
              {featuredSpaces}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e6ebf2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Inactive
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#101828]">
              {inactiveSpaces}
            </p>
          </div>
        </div>

        <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Co-working Spaces
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Total spaces: {spaces.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Space
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    City
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    University
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Starts From
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {spaces.map((space) => (
                  <tr key={space.id} className="border-t border-gray-100">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {space.name_en || space.name_ar || `Space ${space.id}`}
                        </p>

                        {space.name_ar ? (
                          <p className="mt-1 text-xs text-gray-500">{space.name_ar}</p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {space.phone || '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {getCityLabel(space)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {getUniversityLabel(space)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          space.is_active !== false
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-gray-100 text-gray-600'
                        }`}
                      >
                        {space.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          space.is_featured
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-gray-100 text-gray-600'
                        }`}
                      >
                        {space.is_featured ? 'Featured' : 'No'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {space.price_starts_from_egp != null
                        ? `${space.price_starts_from_egp} EGP/hr`
                        : '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(space.updated_at)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/services/co-working-spaces/${space.id}`}
                        className="inline-flex rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-medium text-[#344054] transition hover:bg-[#f9fafb]"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {spaces.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No co-working spaces found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}