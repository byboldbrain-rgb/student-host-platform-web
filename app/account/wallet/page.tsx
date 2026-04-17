import Link from 'next/link'
import {
  getMyDepositRequestsAction,
  getMyWalletAction,
  getMyWalletTransactionsAction,
  getWalletPaymentMethodsAction,
} from '@/src/lib/actions/wallet'
import { createWalletDepositRequestWithUploadAction } from './actions'
import WalletSubmitButton from './submit-button'

export default async function AccountWalletPage() {
  const [wallet, transactions, depositRequests, paymentMethods] =
    await Promise.all([
      getMyWalletAction(),
      getMyWalletTransactionsAction(20),
      getMyDepositRequestsAction(20),
      getWalletPaymentMethodsAction(),
    ])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المحفظة</h1>
          <p className="mt-1 text-sm text-gray-600">
            يمكنك متابعة الرصيد ورفع إيصال شحن ومراجعة آخر المعاملات.
          </p>
        </div>

        <Link
          href="/account"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          الرجوع إلى حسابي
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">الرصيد الحالي</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {Number(wallet?.balance ?? 0).toFixed(2)} جنيه
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            طلب شحن جديد
          </h2>

          <form
            action={createWalletDepositRequestWithUploadAction}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                المبلغ
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="1"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                وسيلة الدفع
              </label>
              <select
                name="payment_method"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
              >
                <option value="">اختر وسيلة الدفع</option>
                {paymentMethods.map((method: any) => (
                  <option key={method.id} value={method.code}>
                    {method.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                اسم صاحب التحويل
              </label>
              <input
                name="sender_name"
                type="text"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                رقم الهاتف
              </label>
              <input
                name="sender_phone"
                type="text"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                مرجع العملية
              </label>
              <input
                name="transaction_reference"
                type="text"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                صورة الإيصال
              </label>
              <input
                name="receipt_file"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-white focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                يمكنك رفع صورة الإيصال مباشرة من جهازك.
              </p>
            </div>

            <WalletSubmitButton />
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            طلبات الشحن الأخيرة
          </h2>

          <div className="space-y-3">
            {depositRequests.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد طلبات شحن بعد.</p>
            ) : (
              depositRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">
                      {Number(request.amount).toFixed(2)} جنيه
                    </p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {request.status === 'pending'
                        ? 'قيد المراجعة'
                        : request.status === 'approved'
                        ? 'تم الاعتماد'
                        : 'مرفوض'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    الوسيلة: {request.payment_method}
                  </p>

                  {request.receipt_image_url ? (
                    <a
                      href={request.receipt_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-black underline"
                    >
                      عرض الإيصال
                    </a>
                  ) : null}

                  {request.review_notes ? (
                    <p className="mt-2 text-sm text-gray-600">
                      ملاحظات: {request.review_notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          آخر المعاملات
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-right text-gray-500">
                <th className="px-3 py-2">النوع</th>
                <th className="px-3 py-2">الاتجاه</th>
                <th className="px-3 py-2">المبلغ</th>
                <th className="px-3 py-2">الرصيد بعد العملية</th>
                <th className="px-3 py-2">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>
                    لا توجد معاملات بعد.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="px-3 py-3">{tx.transaction_type}</td>
                    <td className="px-3 py-3">
                      {tx.wallet_direction === 'credit' ? 'إضافة' : 'خصم'}
                    </td>
                    <td className="px-3 py-3">
                      {Number(tx.amount).toFixed(2)} جنيه
                    </td>
                    <td className="px-3 py-3">
                      {Number(tx.balance_after).toFixed(2)} جنيه
                    </td>
                    <td className="px-3 py-3">
                      {new Date(tx.created_at).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}