import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  approveDepositRequestAction,
  rejectDepositRequestAction,
} from './actions'

function formatCurrency(amount: number | string | null) {
  const value = Number(amount || 0)
  return `${value.toFixed(2)} جنيه`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ar-EG')
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'تم الاعتماد',
        dotClass: 'bg-emerald-400',
        badgeClass:
          'border border-emerald-200 bg-emerald-50 text-emerald-700',
        cardAccent: 'border-emerald-100',
        actionTone: 'emerald',
        glow: 'shadow-[0_18px_50px_rgba(16,185,129,0.08)]',
      }
    case 'rejected':
      return {
        label: 'مرفوض',
        dotClass: 'bg-rose-400',
        badgeClass: 'border border-rose-200 bg-rose-50 text-rose-700',
        cardAccent: 'border-rose-100',
        actionTone: 'rose',
        glow: 'shadow-[0_18px_50px_rgba(244,63,94,0.08)]',
      }
    default:
      return {
        label: 'قيد المراجعة',
        dotClass: 'bg-amber-400',
        badgeClass: 'border border-amber-200 bg-amber-50 text-amber-700',
        cardAccent: 'border-[#dbe5ff]',
        actionTone: 'blue',
        glow: 'shadow-[0_18px_50px_rgba(5,74,255,0.08)]',
      }
  }
}

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'pending' | 'approved' | 'rejected'
}) {
  const toneClass = {
    default: 'border-black/5 bg-white text-[#20212a]',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone]

  const iconClass = {
    default: 'bg-[#f3f6ff] text-[#054aff]',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
  }[tone]

  return (
    <div
      className={`rounded-[28px] border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.035)] ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] font-bold opacity-70">{label}</div>
          <div className="mt-2 text-[32px] font-black tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${iconClass}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.9}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 9.75h16.5m-13.5 4.5h3m-3 3h6M5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v9A2.25 2.25 0 0 1 18.75 18.75H5.25A2.25 2.25 0 0 1 3 16.5v-9A2.25 2.25 0 0 1 5.25 5.25Z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.025)] sm:px-5">
      <div className="mb-2 text-[13px] font-bold text-gray-500">{label}</div>
      <div
        className={[
          'break-words text-[15px] font-black text-[#20212a] sm:text-[16px]',
          mono ? 'font-mono tracking-wide' : '',
        ].join(' ')}
        dir={mono ? 'ltr' : undefined}
      >
        {value}
      </div>
    </div>
  )
}

function ReviewTextarea({
  name,
  placeholder,
}: {
  name: string
  placeholder: string
}) {
  return (
    <textarea
      name={name}
      rows={4}
      placeholder={placeholder}
      className="min-h-[118px] w-full resize-none rounded-[22px] border border-black/5 bg-white px-4 py-3 text-[15px] text-[#20212a] outline-none transition placeholder:text-gray-400 focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
    />
  )
}

function ActionButton({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'approve' | 'reject'
}) {
  const className =
    variant === 'approve'
      ? 'bg-emerald-600 text-white ring-emerald-600/15 hover:bg-emerald-700'
      : 'bg-rose-600 text-white ring-rose-600/15 hover:bg-rose-700'

  return (
    <button
      type="submit"
      className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-4 ${className}`}
    >
      {children}
    </button>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h3 className="text-[20px] font-black tracking-tight text-[#20212a]">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-sm leading-7 text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default async function AdminDepositRequestsPage() {
  await requireSuperAdminAccess()

  const supabase = createAdminClient()

  const { data: requests, error } = await supabase
    .from('wallet_deposit_requests')
    .select(`
      id,
      amount,
      payment_method,
      receipt_image_url,
      sender_name,
      sender_phone,
      transaction_reference,
      status,
      review_notes,
      reviewed_at,
      created_at,
      user_id
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const totalRequests = requests?.length ?? 0
  const pendingCount =
    requests?.filter((item: any) => item.status === 'pending').length ?? 0
  const approvedCount =
    requests?.filter((item: any) => item.status === 'approved').length ?? 0
  const rejectedCount =
    requests?.filter((item: any) => item.status === 'rejected').length ?? 0

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#20212a] sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[34px] border border-black/5 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-5 lg:p-6">
          <div className="relative overflow-hidden rounded-[30px] border border-[#dbe5ff] bg-gradient-to-l from-[#08152f] via-[#0b1f46] to-[#054aff] p-5 text-white shadow-[0_16px_40px_rgba(5,74,255,0.20)] sm:p-7 lg:p-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#6ea8ff]/25 blur-2xl" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.10]" />
            </div>

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white/85 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-[#9bd86a]" />
                  Finance Admin
                </div>

                <h1 className="mt-4 text-[30px] font-black tracking-tight text-white sm:text-[40px] lg:text-[46px]">
                  طلبات شحن المحفظة
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-[15px]">
                  راجع طلبات الإيداع، تحقق من بيانات التحويل والإيصالات، ثم
                  اعتمد الطلب أو ارفضه من نفس الصفحة بتجربة أكثر وضوحًا وتناسقًا
                  مع هوية Navienty.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-[#054aff] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
                >
                  الرجوع للإدارة
                </Link>

                <div className="rounded-[24px] border border-white/12 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="text-[12px] font-bold text-white/65">
                    الطلبات قيد المراجعة
                  </div>
                  <div className="mt-1 text-[28px] font-black leading-none text-white">
                    {pendingCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="إجمالي الطلبات" value={totalRequests} />
            <StatCard label="قيد المراجعة" value={pendingCount} tone="pending" />
            <StatCard label="تم الاعتماد" value={approvedCount} tone="approved" />
            <StatCard label="مرفوض" value={rejectedCount} tone="rejected" />
          </div>
        </section>

        {!requests || requests.length === 0 ? (
          <section className="mt-6 rounded-[34px] border border-black/5 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#f3f6ff] text-[#054aff] shadow-[0_12px_30px_rgba(5,74,255,0.10)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-9 w-9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a8.25 8.25 0 1 1-16.5 0A8.25 8.25 0 0 1 21 12Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9.75H9.6a1.35 1.35 0 0 0 0 2.7h4.8a1.35 1.35 0 0 1 0 2.7H8.25M12 7.5v9"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-[26px] font-black tracking-tight text-[#20212a]">
              لا توجد طلبات شحن حاليًا
            </h2>

            <p className="mt-2 text-sm leading-7 text-gray-500">
              بمجرد وصول طلبات جديدة ستظهر هنا لبدء المراجعة.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            {requests.map((request: any) => {
              const status = getStatusConfig(request.status)

              return (
                <section
                  key={request.id}
                  className={`overflow-hidden rounded-[34px] border bg-white ${status.cardAccent} ${status.glow}`}
                >
                  <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="p-5 sm:p-6 lg:p-7">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold ${status.badgeClass}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${status.dotClass}`}
                              />
                              {status.label}
                            </span>

                            <span className="rounded-full border border-black/5 bg-[#f7f7f7] px-3.5 py-1.5 text-[12px] font-bold text-gray-500">
                              {formatDate(request.created_at)}
                            </span>
                          </div>

                          <h2 className="mt-4 text-[26px] font-black tracking-tight text-[#20212a] sm:text-[30px]">
                            طلب #{request.id}
                          </h2>

                          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
                            تحقق من صاحب التحويل، رقم الهاتف، مرجع العملية
                            وصورة الإيصال قبل اتخاذ القرار.
                          </p>
                        </div>

                        <div className="rounded-[26px] border border-[#dbe5ff] bg-[#f3f6ff] px-5 py-4 text-right shadow-[0_12px_30px_rgba(5,74,255,0.08)] lg:min-w-[220px]">
                          <div className="text-[12px] font-bold text-[#054aff]/70">
                            قيمة الطلب
                          </div>
                          <div className="mt-1 text-[28px] font-black tracking-tight text-[#054aff]">
                            {formatCurrency(request.amount)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 space-y-7">
                        <div>
                          <SectionTitle
                            title="بيانات الطلب"
                            subtitle="كل بيانات التحويل الأساسية في مكان واحد للمراجعة السريعة."
                          />

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <InfoItem
                              label="معرّف المستخدم"
                              value={request.user_id || '-'}
                              mono
                            />
                            <InfoItem
                              label="وسيلة الدفع"
                              value={request.payment_method || '-'}
                            />
                            <InfoItem
                              label="اسم صاحب التحويل"
                              value={request.sender_name || '-'}
                            />
                            <InfoItem
                              label="رقم الهاتف"
                              value={request.sender_phone || '-'}
                              mono
                            />
                            <InfoItem
                              label="مرجع العملية"
                              value={request.transaction_reference || '-'}
                              mono
                            />
                            <InfoItem
                              label="تاريخ المراجعة"
                              value={formatDate(request.reviewed_at)}
                            />
                          </div>
                        </div>

                        {request.receipt_image_url ? (
                          <div>
                            <SectionTitle
                              title="الإيصال المرفق"
                              subtitle="اضغط على الصورة أو الزر لفتح الإيصال بالحجم الكامل."
                            />

                            <div className="mt-4 overflow-hidden rounded-[30px] border border-black/5 bg-[#f7f7f7] shadow-[0_10px_30px_rgba(0,0,0,0.035)]">
                              <a
                                href={request.receipt_image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="block bg-[#f3f6ff]"
                              >
                                <img
                                  src={request.receipt_image_url}
                                  alt={`Receipt ${request.id}`}
                                  className="h-[250px] w-full object-cover transition duration-300 hover:scale-[1.01] sm:h-[340px]"
                                />
                              </a>

                              <div className="flex flex-col gap-4 border-t border-black/5 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div>
                                  <div className="text-sm font-black text-[#20212a]">
                                    صورة إيصال التحويل
                                  </div>
                                  <p className="mt-1 text-xs leading-6 text-gray-500">
                                    يفضل مطابقة الاسم والرقم والمرجع مع بيانات
                                    الطلب قبل الاعتماد.
                                  </p>
                                </div>

                                <a
                                  href={request.receipt_image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-full bg-[#054aff] px-5 py-3 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#003bd1]"
                                >
                                  فتح صورة الإيصال
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-amber-100 text-amber-700">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.9}
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m0 3.75h.008v.008H12V16.5Zm8.25-4.5a8.25 8.25 0 1 1-16.5 0 8.25 8.25 0 0 1 16.5 0Z"
                                  />
                                </svg>
                              </div>

                              <div>
                                <div className="text-sm font-black text-amber-900">
                                  لا توجد صورة إيصال مرفقة لهذا الطلب
                                </div>
                                <p className="mt-1 text-sm leading-7 text-amber-800/75">
                                  يفضل عدم اعتماد الطلب قبل توفر دليل تحويل واضح.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.review_notes ? (
                          <div className="rounded-[28px] border border-black/5 bg-[#f7f7f7] p-5">
                            <SectionTitle title="ملاحظات المراجعة" />
                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                              {request.review_notes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <aside className="border-t border-black/5 bg-[#fbfbfb] p-5 sm:p-6 lg:p-7 xl:border-r xl:border-t-0">
                      {request.status === 'pending' ? (
                        <div className="space-y-4 xl:sticky xl:top-6">
                          <form
                            action={approveDepositRequestAction}
                            className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                          >
                            <input
                              type="hidden"
                              name="deposit_request_id"
                              value={request.id}
                            />

                            <div className="mb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-100 text-emerald-700">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="h-6 w-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m4.5 12.75 6 6 9-13.5"
                                  />
                                </svg>
                              </div>

                              <h3 className="mt-4 text-[20px] font-black tracking-tight text-emerald-950">
                                اعتماد الطلب
                              </h3>
                              <p className="mt-1 text-sm leading-7 text-emerald-900/75">
                                سيتم اعتماد الطلب وإضافة الرصيد إلى محفظة
                                المستخدم.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-2.5 block text-[13px] font-bold text-emerald-950">
                                  ملاحظات الاعتماد
                                </label>
                                <ReviewTextarea
                                  name="review_notes"
                                  placeholder="أدخل أي ملاحظات مرتبطة بعملية الاعتماد..."
                                />
                              </div>

                              <ActionButton variant="approve">
                                اعتماد وإضافة الرصيد
                              </ActionButton>
                            </div>
                          </form>

                          <form
                            action={rejectDepositRequestAction}
                            className="rounded-[30px] border border-rose-200 bg-rose-50 p-5 shadow-[0_12px_30px_rgba(244,63,94,0.08)]"
                          >
                            <input
                              type="hidden"
                              name="deposit_request_id"
                              value={request.id}
                            />

                            <div className="mb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100 text-rose-700">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="h-6 w-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18 18 6M6 6l12 12"
                                  />
                                </svg>
                              </div>

                              <h3 className="mt-4 text-[20px] font-black tracking-tight text-rose-950">
                                رفض الطلب
                              </h3>
                              <p className="mt-1 text-sm leading-7 text-rose-900/75">
                                أضف سببًا واضحًا للرفض حتى يكون القرار موثقًا
                                بشكل مناسب.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-2.5 block text-[13px] font-bold text-rose-950">
                                  سبب الرفض
                                </label>
                                <ReviewTextarea
                                  name="review_notes"
                                  placeholder="اذكر سبب رفض الطلب بشكل واضح..."
                                />
                              </div>

                              <ActionButton variant="reject">
                                رفض الطلب
                              </ActionButton>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.035)] xl:sticky xl:top-6">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#f3f6ff] text-[#054aff]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.9}
                              stroke="currentColor"
                              className="h-7 w-7"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          </div>

                          <h3 className="mt-4 text-[20px] font-black tracking-tight text-[#20212a]">
                            حالة الطلب
                          </h3>

                          <div
                            className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${status.badgeClass}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${status.dotClass}`}
                            />
                            {status.label}
                          </div>

                          <p className="mt-4 text-sm leading-7 text-gray-500">
                            هذا الطلب تم التعامل معه بالفعل، ويمكنك مراجعة
                            البيانات والإيصال والملاحظات من نفس البطاقة.
                          </p>

                          {request.reviewed_at ? (
                            <div className="mt-5 rounded-[22px] border border-black/5 bg-[#f7f7f7] px-4 py-3">
                              <div className="text-[13px] font-bold text-gray-500">
                                آخر وقت مراجعة
                              </div>
                              <div className="mt-1 text-[15px] font-black text-[#20212a]">
                                {formatDate(request.reviewed_at)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </aside>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}