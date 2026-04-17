import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import {
  requireCoworkingPageAccess,
  canCreateCoworkingSpaces,
  isCoworkingSuperAdmin,
} from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

type CityRow = {
  id: string
  name_en: string
  name_ar?: string | null
}

type UniversityRow = {
  id: string
  name_en: string
  name_ar?: string | null
  city_id?: string | null
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default async function NewCoworkingSpacePage() {
  const adminContext = await requireCoworkingPageAccess()
  const admin = adminContext.admin
  const adminName = getAdminDisplayName(admin)

  if (!canCreateCoworkingSpaces(admin)) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()

  const [{ data: cities, error: citiesError }, { data: universities, error: universitiesError }] =
    await Promise.all([
      supabase
        .from('cities')
        .select('id, name_en, name_ar')
        .order('name_en', { ascending: true }),
      supabase
        .from('universities')
        .select('id, name_en, name_ar, city_id')
        .order('name_en', { ascending: true }),
    ])

  if (citiesError) {
    throw new Error(citiesError.message)
  }

  if (universitiesError) {
    throw new Error(universitiesError.message)
  }

  async function createCoworkingSpace(formData: FormData) {
    'use server'

    const adminContext = await requireCoworkingPageAccess()
    const admin = adminContext.admin

    if (!canCreateCoworkingSpaces(admin)) {
      redirect('/admin/unauthorized')
    }

    const supabase = await createClient()

    const name_en = String(formData.get('name_en') || '').trim()
    const name_ar = String(formData.get('name_ar') || '').trim()
    const city_id = String(formData.get('city_id') || '').trim()
    const primary_university_id = String(formData.get('primary_university_id') || '').trim()
    const short_description_en = String(formData.get('short_description_en') || '').trim()
    const short_description_ar = String(formData.get('short_description_ar') || '').trim()
    const full_description_en = String(formData.get('full_description_en') || '').trim()
    const full_description_ar = String(formData.get('full_description_ar') || '').trim()
    const address_line = String(formData.get('address_line') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const website_url = String(formData.get('website_url') || '').trim()
    const google_maps_url = String(formData.get('google_maps_url') || '').trim()
    const whatsapp_number = String(formData.get('whatsapp_number') || '').trim()
    const logo_url = String(formData.get('logo_url') || '').trim()
    const cover_image_url = String(formData.get('cover_image_url') || '').trim()
    const opening_time = String(formData.get('opening_time') || '').trim()
    const closing_time = String(formData.get('closing_time') || '').trim()
    const price_starts_from_egp_raw = String(formData.get('price_starts_from_egp') || '').trim()
    const is_featured = formData.get('is_featured') === 'on'
    const is_active = formData.get('is_active') === 'on'

    if (!name_en || !name_ar || !city_id) {
      throw new Error('Name (EN), Name (AR), and City are required.')
    }

    const slug = slugify(name_en)

    const price_starts_from_egp =
      price_starts_from_egp_raw !== '' ? Number(price_starts_from_egp_raw) : null

    if (price_starts_from_egp !== null && Number.isNaN(price_starts_from_egp)) {
      throw new Error('Invalid starting price.')
    }

    const insertPayload = {
      name_en,
      name_ar,
      slug,
      city_id,
      primary_university_id: primary_university_id || null,
      short_description_en: short_description_en || null,
      short_description_ar: short_description_ar || null,
      full_description_en: full_description_en || null,
      full_description_ar: full_description_ar || null,
      address_line: address_line || null,
      phone: phone || null,
      email: email || null,
      website_url: website_url || null,
      google_maps_url: google_maps_url || null,
      whatsapp_number: whatsapp_number || null,
      logo_url: logo_url || null,
      cover_image_url: cover_image_url || null,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      price_starts_from_egp,
      is_featured,
      is_active,
      created_by_admin_id: admin.id,
      updated_by_admin_id: admin.id,
    }

    const { data, error } = await supabase
      .from('coworking_spaces')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/admin/services/co-working-spaces')
    redirect(`/admin/services/co-working-spaces/${data.id}`)
  }

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
              href="/admin/services/co-working-spaces"
              className="rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-medium text-[#344054] transition hover:bg-[#f9fafb]"
            >
              Back
            </Link>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Add Co-working Space</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new place, then later attach units and images.
          </p>
        </div>

        <form
          action={createCoworkingSpace}
          className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name (EN)</label>
              <input
                name="name_en"
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                placeholder="Work Hub"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name (AR)</label>
              <input
                name="name_ar"
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                placeholder="ورك هب"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
              <select
                name="city_id"
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                defaultValue=""
              >
                <option value="" disabled>
                  Select city
                </option>
                {(cities as CityRow[]).map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_en || city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Primary University
              </label>
              <select
                name="primary_university_id"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                defaultValue=""
              >
                <option value="">No primary university</option>
                {(universities as UniversityRow[]).map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name_en || university.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Short Description (EN)
              </label>
              <textarea
                name="short_description_en"
                rows={3}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                placeholder="Quiet shared workspaces near campus."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Short Description (AR)
              </label>
              <textarea
                name="short_description_ar"
                rows={3}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
                placeholder="مساحات عمل هادئة بالقرب من الجامعة."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Description (EN)
              </label>
              <textarea
                name="full_description_en"
                rows={5}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Description (AR)
              </label>
              <textarea
                name="full_description_ar"
                rows={5}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
              <input
                name="address_line"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">WhatsApp</label>
              <input
                name="whatsapp_number"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Website URL</label>
              <input
                name="website_url"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Google Maps URL
              </label>
              <input
                name="google_maps_url"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Logo URL</label>
              <input
                name="logo_url"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Cover Image URL</label>
              <input
                name="cover_image_url"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Opening Time</label>
              <input
                name="opening_time"
                type="time"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Closing Time</label>
              <input
                name="closing_time"
                type="time"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Starting Price (EGP / hour)
              </label>
              <input
                name="price_starts_from_egp"
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#175cd3]"
              />
            </div>

            <div className="flex items-center gap-6 pt-8">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input name="is_active" type="checkbox" defaultChecked />
                Active
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input name="is_featured" type="checkbox" />
                Featured
              </label>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              href="/admin/services/co-working-spaces"
              className="rounded-full border border-[#d0d5dd] bg-white px-5 py-2.5 text-sm font-medium text-[#344054] transition hover:bg-[#f9fafb]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-full bg-[#175cd3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1849a9]"
            >
              Save Space
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}