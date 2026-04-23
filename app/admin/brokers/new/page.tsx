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

const BROKER_IMAGES_BUCKET = 'Broker-images'
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const primaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]'

const secondaryButtonClass =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa]'

const inputClass =
  'h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const fileInputClass =
  'block w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-[#222222] outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function BrandLogo() {
  return (
    <Link href="/admin" className="navienty-logo" aria-label="Navienty admin home">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string
  label: string
  isPrimary?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200',
        isPrimary
          ? 'border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]',
      ].join(' ')}
    >
      {label}
    </Link>
  )
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
    const city_id = getString(formData, 'city_id')
    const university_ids = formData
      .getAll('university_ids')
      .map((value) => String(value).trim())
      .filter(Boolean)

    const imageFile = formData.get('image_file')

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

    let uploadedImageUrl: string | null = null
    let uploadedStoragePath: string | null = null

    if (imageFile instanceof File && imageFile.size > 0) {
      if (!imageFile.type.startsWith('image/')) {
        redirect('/admin/brokers/new?error=Please upload a valid image file')
      }

      if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
        redirect('/admin/brokers/new?error=Image size must be 5 MB or less')
      }

      const safeFileName = sanitizeFileName(imageFile.name || 'broker-image')
      const fileExt = safeFileName.includes('.') ? safeFileName.split('.').pop() : 'jpg'
      const storagePath = `brokers/${Date.now()}-${crypto.randomUUID()}.${fileExt}`

      const arrayBuffer = await imageFile.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from(BROKER_IMAGES_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) {
        redirect(`/admin/brokers/new?error=${encodeURIComponent(uploadError.message)}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from(BROKER_IMAGES_BUCKET)
        .getPublicUrl(storagePath)

      uploadedImageUrl = publicUrlData.publicUrl
      uploadedStoragePath = storagePath
    }

    const { data: brokerData, error: brokerError } = await supabase
      .from('brokers')
      .insert({
        full_name,
        phone_number,
        whatsapp_number,
        email: email || null,
        company_name: company_name || null,
        image_url: uploadedImageUrl,
      })
      .select('id')
      .single()

    if (brokerError || !brokerData) {
      if (uploadedStoragePath) {
        await supabase.storage.from(BROKER_IMAGES_BUCKET).remove([uploadedStoragePath])
      }

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

      if (uploadedStoragePath) {
        await supabase.storage.from(BROKER_IMAGES_BUCKET).remove([uploadedStoragePath])
      }

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
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#fbfbfb] pb-28 text-gray-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/properties/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add Property
              </Link>

              <Link
                href="/admin/cities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add City
              </Link>

              <Link
                href="/admin/universities/new"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Add University
              </Link>

              <Link
                href="/admin/brokers/new"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Add Broker
              </Link>

              <Link
                href="/admin/properties/review"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Review Queue
              </Link>

              <Link
                href="/admin/properties/admins"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Property Admins
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#222222]">
                  Enter broker information
                </h2>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
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
                      Area Name
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
                      placeholder="broker@navienty.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      Broker Image
                    </label>
                    <input
                      type="file"
                      name="image_file"
                      accept="image/*"
                      className={fileInputClass}
                    />
                  
                  </div>
                </div>

                <div className="rounded-[24px] border border-gray-200 bg-[#fcfcfd] p-4 md:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#222222]">
                      City & Universities
                    </h3>
                   
                  </div>

                  <BrokerUniversitySelector cities={cities} universities={universities} />
                </div>

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

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-2">
            <MobileBottomNavItem href="/admin/properties/new" label="Add Property" />
            <MobileBottomNavItem href="/admin/cities/new" label="Add City" />
            <MobileBottomNavItem href="/admin/universities/new" label="Add University" />
            <MobileBottomNavItem href="/admin/brokers/new" label="Add Broker" isPrimary />
            <MobileBottomNavItem href="/admin/properties/review" label="Review Queue" />
            <MobileBottomNavItem href="/admin/properties/admins" label="Property Admins" />
          </div>
        </nav>
      </main>
    </>
  )
}