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
        badgeClass:
          'border border-emerald-200 bg-emerald-50 text-emerald-700',
        cardGlow: 'shadow-[0_18px_50px_rgba(16,185,129,0.06)]',
      }
    case 'rejected':
      return {
        label: 'مرفوض',
        badgeClass: 'border border-rose-200 bg-rose-50 text-rose-700',
        cardGlow: 'shadow-[0_18px_50px_rgba(244,63,94,0.06)]',
      }
    default:
      return {
        label: 'قيد المراجعة',
        badgeClass: 'border border-amber-200 bg-amber-50 text-amber-700',
        cardGlow: 'shadow-[0_18px_50px_rgba(245,158,11,0.06)]',
      }
  }
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="mb-2 text-[13px] font-bold text-slate-500">{label}</div>
      <div
        className={[
          'text-[15px] font-black text-slate-950 sm:text-[16px]',
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
      className="min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
    />
  )
}

function ActionButton({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: 'approve' | 'reject'
}) {
  const className =
    variant === 'approve'
      ? 'bg-emerald-600 hover:bg-white hover:text-emerald-600 border-2 border-emerald-600 text-white'
      : 'bg-rose-600 hover:bg-white hover:text-rose-600 border-2 border-rose-600 text-white'

  return (
    <button
      type="submit"
      className={`w-full rounded-full px-5 py-3 text-sm font-black uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </button>
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px]">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-700">
                  Finance Admin
                </span>

                <h1 className="mt-3 text-[28px] font-black tracking-tight text-slate-950 sm:text-[34px]">
                  طلبات شحن المحفظة
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  راجع طلبات الإيداع، وتحقق من بيانات التحويل والإيصالات، ثم اعتمد
                  الطلب أو ارفضه من نفس الصفحة بأسلوب منظم ومتناسق مع هوية المنصة.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  الرجوع للإدارة
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="text-[13px] font-bold text-slate-500">إجمالي الطلبات</div>
              <div className="mt-2 text-[28px] font-black tracking-tight text-slate-950">
                {totalRequests}
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
              <div className="text-[13px] font-bold text-amber-700">قيد المراجعة</div>
              <div className="mt-2 text-[28px] font-black tracking-tight text-amber-800">
                {pendingCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-[13px] font-bold text-emerald-700">تم الاعتماد</div>
              <div className="mt-2 text-[28px] font-black tracking-tight text-emerald-800">
                {approvedCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
              <div className="text-[13px] font-bold text-rose-700">مرفوض</div>
              <div className="mt-2 text-[28px] font-black tracking-tight text-rose-800">
                {rejectedCount}
              </div>
            </div>
          </div>
        </section>

        {!requests || requests.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl">
              💳
            </div>
            <h2 className="mt-4 text-[24px] font-black tracking-tight text-slate-950">
              لا توجد طلبات شحن حاليًا
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              بمجرد وصول طلبات جديدة ستظهر هنا لبدء المراجعة.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {requests.map((request: any) => {
              const status = getStatusConfig(request.status)

              return (
                <section
                  key={request.id}
                  className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white ${status.cardGlow} sm:rounded-[32px]`}
                >
                  <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-[22px] font-black tracking-tight text-slate-950 sm:text-[25px]">
                            طلب #{request.id}
                          </h2>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          تاريخ الإنشاء: {formatDate(request.created_at)}
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                        <div className="text-[12px] font-bold text-slate-500">
                          قيمة الطلب
                        </div>
                        <div className="mt-1 text-[22px] font-black tracking-tight text-slate-950">
                          {formatCurrency(request.amount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.3fr)_420px] sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[20px] font-black tracking-tight text-slate-950">
                          بيانات الطلب
                        </h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <InfoItem label="معرّف المستخدم" value={request.user_id || '-'} />
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
                          <h3 className="text-[20px] font-black tracking-tight text-slate-950">
                            الإيصال المرفق
                          </h3>

                          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                            <a
                              href={request.receipt_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={request.receipt_image_url}
                                alt={`Receipt ${request.id}`}
                                className="h-[240px] w-full object-cover sm:h-[320px]"
                              />
                            </a>

                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  صورة إيصال التحويل
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  يمكنك فتح الصورة بحجم كامل في نافذة جديدة للتحقق
                                  من البيانات.
                                </p>
                              </div>

                              <a
                                href={request.receipt_image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900"
                              >
                                فتح صورة الإيصال
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                          <div className="text-sm font-black text-amber-800">
                            لا توجد صورة إيصال مرفقة لهذا الطلب
                          </div>
                        </div>
                      )}

                      {request.review_notes ? (
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                          <h3 className="text-[18px] font-black tracking-tight text-slate-950">
                            ملاحظات المراجعة
                          </h3>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                            {request.review_notes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      {request.status === 'pending' ? (
                        <>
                          <form
                            action={approveDepositRequestAction}
                            className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-6"
                          >
                            <input
                              type="hidden"
                              name="deposit_request_id"
                              value={request.id}
                            />

                            <div className="mb-4">
                              <h3 className="text-[20px] font-black tracking-tight text-emerald-900">
                                اعتماد الطلب
                              </h3>
                              <p className="mt-1 text-sm leading-7 text-emerald-800/80">
                                سيتم اعتماد الطلب وإضافة الرصيد إلى محفظة المستخدم.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-2.5 block text-[13px] font-bold text-emerald-900">
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
                            className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-[0_10px_30px_rgba(244,63,94,0.08)] sm:p-6"
                          >
                            <input
                              type="hidden"
                              name="deposit_request_id"
                              value={request.id}
                            />

                            <div className="mb-4">
                              <h3 className="text-[20px] font-black tracking-tight text-rose-900">
                                رفض الطلب
                              </h3>
                              <p className="mt-1 text-sm leading-7 text-rose-800/80">
                                أضف سببًا واضحًا للرفض حتى يكون القرار موثقًا بشكل
                                مناسب.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-2.5 block text-[13px] font-bold text-rose-900">
                                  سبب الرفض
                                </label>
                                <ReviewTextarea
                                  name="review_notes"
                                  placeholder="اذكر سبب رفض الطلب بشكل واضح..."
                                />
                              </div>

                              <ActionButton variant="reject">رفض الطلب</ActionButton>
                            </div>
                          </form>
                        </>
                      ) : (
                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
                          <h3 className="text-[20px] font-black tracking-tight text-slate-950">
                            حالة الطلب
                          </h3>

                          <div
                            className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-black ${status.badgeClass}`}
                          >
                            {status.label}
                          </div>

                          <p className="mt-4 text-sm leading-7 text-slate-600">
                            هذا الطلب تم التعامل معه بالفعل، ويمكنك مراجعة البيانات
                            والإيصال والملاحظات من نفس البطاقة.
                          </p>

                          {request.reviewed_at ? (
                            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="text-[13px] font-bold text-slate-500">
                                آخر وقت مراجعة
                              </div>
                              <div className="mt-1 text-[15px] font-black text-slate-950">
                                {formatDate(request.reviewed_at)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
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