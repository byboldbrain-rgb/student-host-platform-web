import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import BrokerUniversitySelector from './BrokerUniversitySelector'

type CityRow = {
  id: string
  name_en: string
  name_ar: string
}

type UniversityRow = {
  id: string
  city_id: string
  name_en: string
  name_ar: string
}

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const inputClass =
  'h-12 w-full rounded-[18px] border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export default async function NewBrokerPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  await requireSuperAdminAccess()

  const supabase = await createClient()

  const [
    { data: citiesData, error: citiesError },
    { data: universitiesData, error: universitiesError },
  ] = await Promise.all([
    supabase.from('cities').select('id, name_en, name_ar').order('name_en', { ascending: true }),
    supabase
      .from('universities')
      .select('id, city_id, name_en, name_ar')
      .order('name_en', { ascending: true }),
  ])

  if (citiesError) {
    throw new Error(citiesError.message)
  }

  if (universitiesError) {
    throw new Error(universitiesError.message)
  }

  const cities = (citiesData || []) as CityRow[]
  const universities = (universitiesData || []) as UniversityRow[]

  async function createBrokerAction(formData: FormData) {
    'use server'

    await requireSuperAdminAccess()

    const full_name = getString(formData, 'full_name')
    const phone_number = getString(formData, 'phone_number')
    const whatsapp_number = getString(formData, 'whatsapp_number')
    const email = getString(formData, 'email')
    const company_name = getString(formData, 'company_name')
    const image_url = getString(formData, 'image_url')
    const city_id = getString(formData, 'city_id')
    const university_ids = formData
      .getAll('university_ids')
      .map((value) => String(value).trim())
      .filter(Boolean)

    if (!full_name || !phone_number || !whatsapp_number || !city_id || university_ids.length === 0) {
      redirect('/admin/brokers/new?error=Please fill all required fields and choose at least one university')
    }

    const supabase = await createClient()

    const { data: selectedUniversities, error: selectedUniversitiesError } = await supabase
      .from('universities')
      .select('id, city_id')
      .in('id', university_ids)

    if (selectedUniversitiesError) {
      redirect(`/admin/brokers/new?error=${encodeURIComponent(selectedUniversitiesError.message)}`)
    }

    const invalidUniversity = (selectedUniversities || []).some(
      (university) => university.city_id !== city_id
    )

    if (invalidUniversity || (selectedUniversities || []).length !== university_ids.length) {
      redirect('/admin/brokers/new?error=Selected universities do not belong to the chosen city')
    }

    const { data: brokerData, error: brokerError } = await supabase
      .from('brokers')
      .insert({
        full_name,
        phone_number,
        whatsapp_number,
        email: email || null,
        company_name: company_name || null,
        image_url: image_url || null,
      })
      .select('id')
      .single()

    if (brokerError || !brokerData) {
      redirect(
        `/admin/brokers/new?error=${encodeURIComponent(
          brokerError?.message || 'Failed to create broker'
        )}`
      )
    }

    const brokerUniversityRows = university_ids.map((university_id) => ({
      broker_id: brokerData.id,
      university_id,
    }))

    const { error: brokerUniversitiesError } = await supabase
      .from('broker_universities')
      .insert(brokerUniversityRows)

    if (brokerUniversitiesError) {
      await supabase.from('brokers').delete().eq('id', brokerData.id)
      redirect(`/admin/brokers/new?error=${encodeURIComponent(brokerUniversitiesError.message)}`)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/properties')
    revalidatePath('/admin/brokers/new')
    redirect('/admin')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = resolvedSearchParams?.error

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 bg-[#F5F7F9] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/properties" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Link href="/admin" className={secondaryButtonClass}>
              Back to Dashboard
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-black/[0.05] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f7f8fa] to-white" />
            <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-blue-50/60 blur-3xl" />

            <div className="relative px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-9">
              <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Properties Setup
              </div>
              <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-[#222222]">
                Add New Broker
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                Create a broker profile and link it to one or more universities. City is derived through the selected universities.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
          {errorMessage && (
            <div className="mb-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          )}

          {cities.length === 0 ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
              You need to create at least one city first before adding a broker.
            </div>
          ) : universities.length === 0 ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
              You need to create at least one university first before adding a broker.
            </div>
          ) : (
            <form action={createBrokerAction} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Ahmed Ali"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    placeholder="Navienty Brokers"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="+20 100 000 0000"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    placeholder="+20 100 000 0000"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="broker@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    placeholder="https://example.com/broker.jpg"
                    className={inputClass}
                  />
                </div>
              </div>

              <BrokerUniversitySelector
                cities={cities}
                universities={universities}
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" className={primaryButtonClass}>
                  Save Broker
                </button>

                <Link href="/admin" className={secondaryButtonClass}>
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}