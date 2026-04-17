import Link from 'next/link'
import { getAdminDoctors } from '@/src/lib/services/health/admin'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[18px] border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]'

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'

const tableButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[14px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-400 hover:bg-[#fafafa] hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)]'

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

function EmptyState() {
  return (
    <section className="mt-6 rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-24 text-center shadow-sm">
      <div className="mx-auto max-w-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f4f6] text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 14c3.314 0 6-2.686 6-6S15.314 2 12 2 6 4.686 6 8s2.686 6 6 6Z" />
            <path d="M4 22a8 8 0 0 1 16 0" />
            <path d="M19 8h2" />
            <path d="M20 7v2" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-[#111827]">
          No doctors found
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          There are currently no doctors to display. Start by adding your first
          doctor.
        </p>

        <div className="mt-6">
          <Link
            href="/admin/services/health/doctors/new"
            className={primaryButtonClass}
          >
            Add First Doctor
          </Link>
        </div>
      </div>
    </section>
  )
}

function DoctorAvatar({
  name,
}: {
  name: string
}) {
  const firstLetter = name.trim().charAt(0).toUpperCase() || 'D'

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.10)]">
      {firstLetter}
    </div>
  )
}

function formatFee(fee?: number | null) {
  if (fee === null || fee === undefined) return '—'
  return `${fee}`
}

export default async function DoctorsPage() {
  const doctors = await getAdminDoctors()

  const activeDoctorsCount = doctors.filter((doctor) => doctor.is_active).length
  const inactiveDoctorsCount = doctors.filter((doctor) => !doctor.is_active).length

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-gray-700">
      <header className="sticky top-0 z-40 h-[130px] border-b border-gray-200/80 bg-[#F5F7F9]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 bg-[#F5F7F9] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/health" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>

            <div className="hidden md:block">
              <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Health Service
              </div>
              <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-[#222222]">
                Doctors Management
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <AdminLogoutButton />

            <Link
              href="/admin/services/health/doctors/new"
              className={primaryButtonClass}
            >
              Add Doctor
            </Link>
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
                <div className="max-w-4xl">
                  <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Doctors Dashboard
                  </div>

                  <h2 className="mt-5 text-[30px] font-semibold tracking-tight text-[#222222] md:text-[40px]">
                    Manage all doctors in one consistent admin experience
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 md:text-[15px]">
                    Review doctor records, monitor consultation details, and keep
                    the health service interface aligned with the same visual
                    identity used across the platform.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/admin/services/health/doctors/new"
                      className={primaryButtonClass}
                    >
                      Add New Doctor
                    </Link>

                    <Link
                      href="/admin/services/health"
                      className={secondaryButtonClass}
                    >
                      Back to Health Home
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-gray-200 bg-[#fcfcfd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <DashboardStatCard
                      label="Total Doctors"
                      value={doctors.length}
                      helper="Registered doctors"
                    />
                    <DashboardStatCard
                      label="Active"
                      value={activeDoctorsCount}
                      helper="Currently active"
                    />
                    <DashboardStatCard
                      label="Inactive"
                      value={inactiveDoctorsCount}
                      helper="Need review or activation"
                    />
                    <DashboardStatCard
                      label="Module"
                      value="Health"
                      helper="Service section"
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
                  Doctors List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
                </p>
              </div>

              <Link
                href="/admin/services/health/doctors/new"
                className={secondaryButtonClass}
              >
                Add Doctor
              </Link>
            </div>
          </div>

          {doctors.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Doctor
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Arabic Name
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Title
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Fee
                      </th>
                      <th className="px-6 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Status
                      </th>
                      <th className="px-8 py-5 text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {doctors.map((doctor) => {
                      const doctorName = doctor.full_name_en || 'Unnamed Doctor'

                      return (
                        <tr
                          key={doctor.id}
                          className="border-t border-gray-100 transition hover:bg-[#fcfcfc]"
                        >
                          <td className="px-8 py-6 align-top">
                            <div className="flex items-start gap-4">
                              <DoctorAvatar name={doctorName} />

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="truncate text-[16px] font-semibold text-[#222222]">
                                    {doctorName}
                                  </div>
                                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    Doctor
                                  </span>
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                  {doctor.title_en || 'No title'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {doctor.full_name_ar || '—'}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {doctor.title_en || '—'}
                          </td>

                          <td className="px-6 py-6 align-top text-sm text-gray-600">
                            {formatFee(doctor.consultation_fee)}
                          </td>

                          <td className="px-6 py-6 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                doctor.is_active
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {doctor.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-8 py-6 align-top">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/services/health/doctors/${doctor.id}`}
                                className={tableButtonClass}
                              >
                                View
                              </Link>

                              <Link
                                href={`/admin/services/health/doctors/${doctor.id}/edit`}
                                className={tableButtonClass}
                              >
                                Edit
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
                {doctors.map((doctor) => {
                  const doctorName = doctor.full_name_en || 'Unnamed Doctor'

                  return (
                    <div
                      key={doctor.id}
                      className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <DoctorAvatar name={doctorName} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-[17px] font-semibold text-[#222222]">
                                {doctorName}
                              </h4>
                              <p className="mt-1 text-sm text-gray-500">
                                {doctor.title_en || 'No title'}
                              </p>
                            </div>

                            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              Doctor
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                doctor.is_active
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-gray-200 bg-gray-100 text-gray-600'
                              }`}
                            >
                              {doctor.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-[#fafafa] p-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                                Arabic Name
                              </div>
                              <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                                {doctor.full_name_ar || '—'}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#fafafa] p-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                                Title
                              </div>
                              <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                                {doctor.title_en || '—'}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#fafafa] p-4 sm:col-span-2">
                              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                                Consultation Fee
                              </div>
                              <div className="mt-2 text-[15px] font-semibold text-[#222222]">
                                {formatFee(doctor.consultation_fee)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/admin/services/health/doctors/${doctor.id}`}
                          className={`${secondaryButtonClass} flex-1`}
                        >
                          View Details
                        </Link>

                        <Link
                          href={`/admin/services/health/doctors/${doctor.id}/edit`}
                          className={`${primaryButtonClass} flex-1`}
                        >
                          Edit Doctor
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <EmptyState />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}