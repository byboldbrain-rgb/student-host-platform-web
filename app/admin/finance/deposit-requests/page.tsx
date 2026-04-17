import Link from 'next/link'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  approveDepositRequestAction,
  rejectDepositRequestAction,
} from './actions'

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">طلبات شحن المحفظة</h1>
          <p className="mt-1 text-sm text-gray-600">
            مراجعة واعتماد أو رفض طلبات شحن المحافظ.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          الرجوع للإدارة
        </Link>
      </div>

      <div className="space-y-4">
        {!requests || requests.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">لا توجد طلبات شحن حاليًا.</p>
          </div>
        ) : (
          requests.map((request: any) => (
            <div
              key={request.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">رقم الطلب:</span> {request.id}
                  </p>
                  <p>
                    <span className="font-semibold">المستخدم:</span> {request.user_id}
                  </p>
                  <p>
                    <span className="font-semibold">المبلغ:</span>{' '}
                    {Number(request.amount).toFixed(2)} جنيه
                  </p>
                  <p>
                    <span className="font-semibold">وسيلة الدفع:</span>{' '}
                    {request.payment_method}
                  </p>
                  <p>
                    <span className="font-semibold">اسم صاحب التحويل:</span>{' '}
                    {request.sender_name || '-'}
                  </p>
                  <p>
                    <span className="font-semibold">رقم الهاتف:</span>{' '}
                    {request.sender_phone || '-'}
                  </p>
                  <p>
                    <span className="font-semibold">مرجع العملية:</span>{' '}
                    {request.transaction_reference || '-'}
                  </p>
                  <p>
                    <span className="font-semibold">الحالة:</span>{' '}
                    {request.status === 'pending'
                      ? 'قيد المراجعة'
                      : request.status === 'approved'
                      ? 'تم الاعتماد'
                      : 'مرفوض'}
                  </p>
                  <p>
                    <span className="font-semibold">تاريخ الإنشاء:</span>{' '}
                    {new Date(request.created_at).toLocaleString('ar-EG')}
                  </p>

                  {request.receipt_image_url ? (
                    <p>
                      <a
                        href={request.receipt_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-black underline"
                      >
                        فتح صورة الإيصال
                      </a>
                    </p>
                  ) : null}

                  {request.review_notes ? (
                    <p>
                      <span className="font-semibold">ملاحظات المراجعة:</span>{' '}
                      {request.review_notes}
                    </p>
                  ) : null}
                </div>

                {request.status === 'pending' ? (
                  <div className="w-full max-w-sm space-y-4">
                    <form
                      action={approveDepositRequestAction}
                      className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4"
                    >
                      <input
                        type="hidden"
                        name="deposit_request_id"
                        value={request.id}
                      />

                      <label className="block text-sm font-medium text-gray-700">
                        ملاحظات الاعتماد
                      </label>
                      <textarea
                        name="review_notes"
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                      />

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-green-600 px-4 py-2 text-white transition hover:opacity-90"
                      >
                        اعتماد وإضافة الرصيد
                      </button>
                    </form>

                    <form
                      action={rejectDepositRequestAction}
                      className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
                    >
                      <input
                        type="hidden"
                        name="deposit_request_id"
                        value={request.id}
                      />

                      <label className="block text-sm font-medium text-gray-700">
                        سبب الرفض
                      </label>
                      <textarea
                        name="review_notes"
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                      />

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-red-600 px-4 py-2 text-white transition hover:opacity-90"
                      >
                        رفض الطلب
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}