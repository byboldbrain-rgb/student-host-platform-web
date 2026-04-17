import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { requirePropertiesSectionAccess } from '@/src/lib/admin-auth'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const inputClass =
  'h-12 w-full rounded-[18px] border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export default async function NewCityPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  await requirePropertiesSectionAccess()

  async function createCityAction(formData: FormData) {
    'use server'

    await requirePropertiesSectionAccess()

    const name_en = getString(formData, 'name_en')
    const name_ar = getString(formData, 'name_ar')

    if (!name_en || !name_ar) {
      redirect('/admin/cities/new?error=Please fill all required fields')
    }

    const supabase = await createClient()

    const { error } = await supabase.from('cities').insert({
      name_en,
      name_ar,
    })

    if (error) {
      redirect(`/admin/cities/new?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/admin/properties')
    redirect('/admin/properties')
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
            <Link href="/admin/properties" className={secondaryButtonClass}>
              Back to Properties
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
                Add New City
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                Create a new city record to use later in properties, universities, and related
                sections.
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

          <form action={createCityAction} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#222222]">
                  City Name (English) *
                </label>
                <input
                  type="text"
                  name="name_en"
                  placeholder="Assiut"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#222222]">
                  City Name (Arabic) *
                </label>
                <input
                  type="text"
                  name="name_ar"
                  placeholder="أسيوط"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className={primaryButtonClass}>
                Save City
              </button>

              <Link href="/admin/properties" className={secondaryButtonClass}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}