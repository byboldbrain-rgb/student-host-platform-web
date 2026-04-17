import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireFoodGroceryPageAccess,
  isSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type SearchParams = {
  city?: string
  university?: string
  category?: string
}

type ProviderCategory = {
  id: number
  slug: string
  name_en: string
  name_ar: string
}

type CityOption = {
  id: string
  name_en: string | null
  name_ar?: string | null
}

type UniversityOption = {
  id: string
  name_en: string | null
  name_ar?: string | null
}

type Provider = {
  id: number
  name_en: string
  name_ar?: string | null
  slug?: string | null
  phone?: string | null
  email?: string | null
  whatsapp_number?: string | null
  logo_url?: string | null
  is_featured: boolean
  is_active: boolean
  created_at?: string | null
  city_id?: string | null
  primary_university_id?: string | null
  service_categories?: {
    slug?: string | null
    name_en?: string | null
    name_ar?: string | null
  } | null
  cities?: {
    name_en?: string | null
    name_ar?: string | null
  } | null
  universities?: {
    name_en?: string | null
    name_ar?: string | null
  } | null
}

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const subtleButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[16px] border border-gray-200 bg-[#f8fafb] px-4 py-2.5 text-sm font-semibold text-[#222222] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-white hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]'

const tableButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[14px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)]'

function getAdminDisplayName(admin: any) {
  const possibleName =
    admin?.full_name ||
    admin?.name ||
    admin?.broker_name ||
    admin?.display_name ||
    admin?.email

  if (!possibleName || typeof possibleName !== 'string') {
    return 'Admin'
  }

  if (possibleName.includes('@')) {
    return possibleName.split('@')[0]
  }

  return possibleName
}

function GridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ProviderLogo({
  provider,
  size = 'md',
}: {
  provider: Provider
  size?: 'md' | 'lg'
}) {
  const imageSizeClass = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-12 w-12 rounded-2xl'
  const fallbackTextSize = size === 'lg' ? 'text-lg' : 'text-base'

  const title = provider.name_en || provider.name_ar || 'Provider'
  const firstLetter = title.trim().charAt(0).toUpperCase() || 'P'

  if (provider.logo_url) {
    return (
      <div
        className={`${imageSizeClass} shrink-0 overflow-hidden border border-gray-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)]`}
      >
        <img
          src={provider.logo_url}
          alt={`${title} logo`}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`${imageSizeClass} flex shrink-0 items-center justify-center border border-gray-200 bg-gray-100 font-semibold text-gray-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] ${fallbackTextSize}`}
    >
      {firstLetter}
    </div>
  )
}

function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)] md:p-6">
      <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-[#222222] md:text-[34px]">
        {value}
      </div>
      <div className="mt-2 text-sm text-gray-500">{helper}</div>
    </div>
  )
}

function EmptyState({
  isFiltered = false,
}: {
  isFiltered?: boolean
}) {
  return (
    <section className="mt-6 rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-24 text-center shadow-sm">
      <div className="mx-auto max-w-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f4f6] text-gray-600">
          <GridIcon />
        </div>

        <h2 className="text-2xl font-semibold text-[#111827]">
          {isFiltered
            ? 'No matching providers found'
            : 'No food & grocery providers found'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          {isFiltered
            ? 'Try changing the selected city, university, or category to find the provider you are looking for.'
            : 'There are currently no restaurants or supermarkets to display.'}
        </p>
      </div>
    </section>
  )
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

function getCategoryBadgeClass(slug?: string | null) {
  if (slug === 'restaurants') {
    return 'border border-orange-200/80 bg-orange-50 text-orange-700'
  }

  if (slug === 'supermarkets') {
    return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  return 'border border-gray-200 bg-gray-100 text-gray-700'
}

function formatCategoryLabel(provider: Provider) {
  const slug = provider.service_categories?.slug

  if (slug === 'restaurants') return 'Restaurant'
  if (slug === 'supermarkets') return 'Supermarket'

  return provider.service_categories?.name_en || 'Unknown'
}

function formatOptionLabel(option: {
  name_en?: string | null
  name_ar?: string | null
}) {
  return option.name_en || option.name_ar || 'Unnamed'
}

function dedupeProvidersById(providers: Provider[]) {
  return Array.from(
    new Map(providers.map((provider) => [provider.id, provider])).values()
  )
}

export default async function AdminFoodGroceryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const adminContext = await requireFoodGroceryPageAccess()
  const supabase = await createClient()
  const admin = adminContext.admin
  const adminName = getAdminDisplayName(admin)

  const {
    city = 'all',
    university = 'all',
    category = 'all',
  } = await searchParams

  const [categoriesRes, citiesRes, universitiesRes, areasCountRes] = await Promise.all([
    supabase
      .from('service_categories')
      .select('id, slug, name_en, name_ar')
      .in('slug', ['restaurants', 'supermarkets']),
    supabase.from('cities').select('id, name_en, name_ar').order('name_en', {
      ascending: true,
    }),
    supabase
      .from('universities')
      .select('id, name_en, name_ar')
      .order('name_en', { ascending: true }),
    supabase.from('city_delivery_areas').select('id', { count: 'exact', head: true }),
  ])

  if (categoriesRes.error) throw new Error(categoriesRes.error.message)
  if (citiesRes.error) throw new Error(citiesRes.error.message)
  if (universitiesRes.error) throw new Error(universitiesRes.error.message)
  if (areasCountRes.error) throw new Error(areasCountRes.error.message)

  const targetCategories = (categoriesRes.data || []) as ProviderCategory[]
  const cityOptions = (citiesRes.data || []) as CityOption[]
  const universityOptions = (universitiesRes.data || []) as UniversityOption[]
  const categoryIds = targetCategories.map((item) => item.id)

  let providers: Provider[] = []

  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from('service_providers')
      .select(`
        id,
        name_en,
        name_ar,
        slug,
        phone,
        email,
        whatsapp_number,
        logo_url,
        is_featured,
        is_active,
        created_at,
        city_id,
        primary_university_id,
        service_categories!service_providers_category_id_fkey (
          slug,
          name_en,
          name_ar
        ),
        cities (
          name_en,
          name_ar
        ),
        universities (
          name_en,
          name_ar
        )
      `)
      .in('category_id', categoryIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    providers = dedupeProvidersById((data || []) as Provider[])
  }

  const restaurantsCount = providers.filter(
    (provider) => provider.service_categories?.slug === 'restaurants'
  ).length

  const supermarketsCount = providers.filter(
    (provider) => provider.service_categories?.slug === 'supermarkets'
  ).length

  const activeCount = providers.filter((provider) => provider.is_active).length

  const filteredProviders = dedupeProvidersById(
    providers.filter((provider) => {
      const matchesCity = city === 'all' || provider.city_id === city
      const matchesUniversity =
        university === 'all' || provider.primary_university_id === university
      const matchesCategory =
        category === 'all' || provider.service_categories?.slug === category

      return matchesCity && matchesUniversity && matchesCategory
    })
  )

  const hasFilters =
    city !== 'all' || university !== 'all' || category !== 'all'

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 bg-[#F5F7F9] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/food-grocery" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>

            <div className="hidden md:block">
              <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Welcome back
              </div>
              <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-[#222222]">
                {adminName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Link href="/admin/services/food-grocery/new" className={primaryButtonClass}>
              Add Provider
            </Link>

            <Link
              href="/admin/services/food-grocery/delivery-defaults"
              className={secondaryButtonClass}
            >
              Manage Cities & Areas
            </Link>

            <Link
              href="/admin/services/food-grocery/orders"
              className={secondaryButtonClass}
            >
              View Orders
            </Link>

            <Link
              href="/admin/services/food-grocery/admin-users"
              className={secondaryButtonClass}
            >
              Admin Users
            </Link>

            {isSuperAdmin(admin) && (
              <Link href="/admin/services" className={secondaryButtonClass}>
                All Services
              </Link>
            )}

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-black/[0.05] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f7f8fa] to-white" />
            <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-blue-50/60 blur-3xl" />

            <div className="relative px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-9">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-center">
                <div className="max-w-7xl">
                  <div className="rounded-[28px] border border-gray-200 bg-[#fcfcfd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-5">
                    <form method="GET" className="grid gap-3 md:grid-cols-2">
                      <select
                        name="city"
                        defaultValue={city}
                        className="h-12 rounded-[18px] border border-gray-300 bg-white px-4 text-sm font-medium text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="all">All Cities</option>
                        {cityOptions.map((cityOption) => (
                          <option key={cityOption.id} value={cityOption.id}>
                            {formatOptionLabel(cityOption)}
                          </option>
                        ))}
                      </select>

                      <select
                        name="university"
                        defaultValue={university}
                        className="h-12 rounded-[18px] border border-gray-300 bg-white px-4 text-sm font-medium text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="all">All Universities</option>
                        {universityOptions.map((universityOption) => (
                          <option key={universityOption.id} value={universityOption.id}>
                            {formatOptionLabel(universityOption)}
                          </option>
                        ))}
                      </select>

                      <select
                        name="category"
                        defaultValue={category}
                        className="h-12 rounded-[18px] border border-gray-300 bg-white px-4 text-sm font-medium text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="all">All Categories</option>
                        <option value="restaurants">Restaurants</option>
                        <option value="supermarkets">Supermarkets</option>
                      </select>

                      <button type="submit" className={`${primaryButtonClass} h-12 w-full`}>
                        Search
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-[28px] border border-gray-200 bg-[#fcfcfd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <DashboardStatCard
                      label="Total Providers"
                      value={providers.length}
                      helper=""
                    />
                    <DashboardStatCard
                      label="Restaurants"
                      value={restaurantsCount}
                      helper=""
                    />
                    <DashboardStatCard
                      label="Supermarkets"
                      value={supermarketsCount}
                      helper=""
                    />
                    <DashboardStatCard
                      label="Delivery Areas"
                      value={areasCountRes.count || 0}
                      helper=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)]">
          <div className="border-b border-gray-200/80 px-5 py-5 md:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight text-[#222222]">
                  Providers List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredProviders.length} provider
                  {filteredProviders.length !== 1 ? 's' : ''}
                  {hasFilters ? ' based on your current filters' : ''}
                </p>
              </div>

              {hasFilters && (
                <Link
                  href="/admin/services/food-grocery"
                  className={secondaryButtonClass}
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </div>

          {filteredProviders.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1320px] text-left">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Provider
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Category
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Contact
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        City
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        University
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Featured
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Created At
                      </th>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProviders.map((provider) => {
                      const title =
                        provider.name_en || provider.name_ar || 'Unnamed Provider'

                      const cityLabel =
                        provider.cities?.name_en || provider.cities?.name_ar || '—'

                      const universityLabel =
                        provider.universities?.name_en ||
                        provider.universities?.name_ar ||
                        '—'

                      const contactLabel =
                        provider.phone ||
                        provider.whatsapp_number ||
                        provider.email ||
                        '—'

                      return (
                        <tr
                          key={provider.id}
                          className="border-t border-gray-100 transition hover:bg-[#fcfcfc]"
                        >
                          <td className="px-8 py-6 align-top">
                            <div className="flex items-start gap-4">
                              <ProviderLogo provider={provider} size="lg" />

                              <div className="min-w-0">
                                <div className="truncate text-[16px] font-semibold text-[#222222]">
                                  {title}
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                  {provider.slug ? `Slug: ${provider.slug}` : 'No slug'}
                                </div>

                                <div className="mt-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      provider.is_active
                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border border-gray-200 bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {provider.is_active
                                      ? 'Active Provider'
                                      : 'Inactive Provider'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                                provider.service_categories?.slug
                              )}`}
                            >
                              {formatCategoryLabel(provider)}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {contactLabel}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {cityLabel}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {universityLabel}
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                provider.is_featured
                                  ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {provider.is_featured ? 'Featured' : 'Standard'}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                provider.is_active
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {provider.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {formatDate(provider.created_at)}
                          </td>

                          <td className="px-8 py-6 align-top">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/services/food-grocery/${provider.id}`}
                                className={tableButtonClass}
                              >
                                Edit
                              </Link>

                              <Link
                                href={`/admin/services/food-grocery/${provider.id}`}
                                className={subtleButtonClass}
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:p-6 xl:hidden">
                {filteredProviders.map((provider) => {
                  const title =
                    provider.name_en || provider.name_ar || 'Unnamed Provider'

                  const cityLabel =
                    provider.cities?.name_en || provider.cities?.name_ar || '—'

                  const universityLabel =
                    provider.universities?.name_en ||
                    provider.universities?.name_ar ||
                    '—'

                  const contactLabel =
                    provider.phone ||
                    provider.whatsapp_number ||
                    provider.email ||
                    '—'

                  return (
                    <div
                      key={provider.id}
                      className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <ProviderLogo provider={provider} size="lg" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-[17px] font-semibold text-[#222222]">
                                {title}
                              </h4>
                              <p className="mt-1 text-sm text-gray-500">
                                {provider.slug ? `Slug: ${provider.slug}` : 'No slug'}
                              </p>
                            </div>

                            <Link
                              href={`/admin/services/food-grocery/${provider.id}`}
                              className={tableButtonClass}
                            >
                              Edit
                            </Link>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                                provider.service_categories?.slug
                              )}`}
                            >
                              {formatCategoryLabel(provider)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                provider.is_featured
                                  ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {provider.is_featured ? 'Featured' : 'Standard'}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                provider.is_active
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {provider.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Contact
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {contactLabel}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            City
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {cityLabel}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            University
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {universityLabel}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fafafa] p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Created At
                          </div>
                          <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                            {formatDate(provider.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/admin/services/food-grocery/${provider.id}`}
                          className={`${primaryButtonClass} flex-1`}
                        >
                          Edit Provider
                        </Link>

                        <Link
                          href={`/admin/services/food-grocery/${provider.id}`}
                          className={`${secondaryButtonClass} flex-1`}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <EmptyState isFiltered={hasFilters} />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}