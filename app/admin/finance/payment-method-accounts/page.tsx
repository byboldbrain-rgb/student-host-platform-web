import Link from 'next/link'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  createPaymentReceiverAccountAction,
  setActivePaymentReceiverAccountAction,
  togglePaymentReceiverAccountAction,
} from './actions'

function getAccountStatus(account: any) {
  if (!account.is_active || !account.is_visible) {
    return 'غير نشط'
  }

  if (account.cooldown_until && new Date(account.cooldown_until) > new Date()) {
    return 'في التهدئة'
  }

  if (
    account.max_receive_amount !== null &&
    Number(account.total_received_amount) >= Number(account.max_receive_amount)
  ) {
    return 'وصل الحد'
  }

  return 'متاح'
}

function formatMoney(value: any) {
  return Number(value ?? 0).toFixed(2)
}

export default async function AdminPaymentMethodAccountsPage() {
  await requireSuperAdminAccess()

  const supabase = createAdminClient()

  const { data: methods, error } = await supabase
    .from('wallet_payment_methods')
    .select(`
      id,
      code,
      name_ar,
      name_en,
      active_account_id,
      sort_order,
      wallet_payment_method_accounts:wallet_payment_method_accounts!wallet_payment_method_accounts_payment_method_id_fkey (
        id,
        payment_method_id,
        label,
        account_name,
        account_number,
        iban,
        qr_image_url,
        is_active,
        is_visible,
        priority,
        total_received_amount,
        max_receive_amount,
        cooldown_until,
        cooldown_hours,
        last_used_at,
        created_at,
        updated_at
      )
    `)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">حسابات وسائل الدفع</h1>
          <p className="mt-1 text-sm text-gray-600">
            إدارة أرقام الاستلام، الحدود القصوى، وفترات التهدئة لكل وسيلة دفع.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          الرجوع للإدارة
        </Link>
      </div>

      <div className="space-y-8">
        {!methods || methods.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">لا توجد وسائل دفع مفعلة حاليًا.</p>
          </div>
        ) : (
          methods.map((method: any) => {
            const accounts = method.wallet_payment_method_accounts || []

            const warningAccounts = accounts.filter((account: any) => {
              if (
                account.max_receive_amount === null ||
                Number(account.max_receive_amount) <= 0
              ) {
                return false
              }

              return (
                Number(account.total_received_amount) / Number(account.max_receive_amount) >=
                0.8
              )
            })

            return (
              <section
                key={method.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {method.name_ar}
                    </h2>
                    <p className="text-sm text-gray-500">{method.code}</p>
                  </div>
                </div>

                {warningAccounts.length > 0 ? (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    يوجد {warningAccounts.length} حسابات اقتربت من الحد الأقصى.
                  </div>
                ) : null}

                <form
                  action={createPaymentReceiverAccountAction}
                  className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-6"
                >
                  <input type="hidden" name="payment_method_id" value={method.id} />

                  <input
                    name="label"
                    placeholder="الوصف"
                    className="rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                  />

                  <input
                    name="account_name"
                    placeholder="اسم المستلم"
                    className="rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                  />

                  <input
                    name="account_number"
                    placeholder="رقم التحويل"
                    className="rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                  />

                  <input
                    name="max_receive_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="الحد الأقصى"
                    className="rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                  />

                  <input
                    name="cooldown_hours"
                    type="number"
                    min="0"
                    placeholder="ساعات التهدئة"
                    className="rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-black px-4 py-2 text-white transition hover:opacity-90"
                  >
                    إضافة حساب
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-right text-gray-500">
                        <th className="px-3 py-2">الوصف</th>
                        <th className="px-3 py-2">رقم التحويل</th>
                        <th className="px-3 py-2">اسم المستلم</th>
                        <th className="px-3 py-2">الاستهلاك</th>
                        <th className="px-3 py-2">الحالة</th>
                        <th className="px-3 py-2">آخر استخدام</th>
                        <th className="px-3 py-2">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-gray-500" colSpan={7}>
                            لا توجد حسابات استقبال لهذه الوسيلة بعد.
                          </td>
                        </tr>
                      ) : (
                        accounts.map((account: any) => {
                          const usage = Number(account.total_received_amount || 0)
                          const max =
                            account.max_receive_amount === null
                              ? null
                              : Number(account.max_receive_amount)
                          const usagePercent =
                            max && max > 0 ? Math.min((usage / max) * 100, 100) : 0
                          const isCurrent = method.active_account_id === account.id

                          return (
                            <tr key={account.id} className="border-b last:border-0">
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span>{account.label || '-'}</span>
                                  {isCurrent ? (
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                      الحالي
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              <td className="px-3 py-3" dir="ltr">
                                {account.account_number || '-'}
                              </td>

                              <td className="px-3 py-3">
                                {account.account_name || '-'}
                              </td>

                              <td className="px-3 py-3">
                                <div className="w-44">
                                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                                    <span>{formatMoney(usage)}</span>
                                    <span>{max === null ? '∞' : formatMoney(max)}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-200">
                                    <div
                                      className="h-2 rounded-full bg-black"
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <div className="space-y-1">
                                  <p>{getAccountStatus(account)}</p>
                                  {account.cooldown_until ? (
                                    <p className="text-xs text-gray-500">
                                      حتى{' '}
                                      {new Date(account.cooldown_until).toLocaleString(
                                        'ar-EG'
                                      )}
                                    </p>
                                  ) : null}
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                {account.last_used_at
                                  ? new Date(account.last_used_at).toLocaleString('ar-EG')
                                  : '-'}
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <form action={togglePaymentReceiverAccountAction}>
                                    <input
                                      type="hidden"
                                      name="account_id"
                                      value={account.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="next_is_active"
                                      value={account.is_active ? 'false' : 'true'}
                                    />
                                    <button
                                      type="submit"
                                      className="rounded-lg border border-gray-300 px-3 py-1 transition hover:bg-gray-50"
                                    >
                                      {account.is_active ? 'تعطيل' : 'تفعيل'}
                                    </button>
                                  </form>

                                  <form action={setActivePaymentReceiverAccountAction}>
                                    <input
                                      type="hidden"
                                      name="payment_method_id"
                                      value={method.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="account_id"
                                      value={account.id}
                                    />
                                    <button
                                      type="submit"
                                      className="rounded-lg border border-gray-300 px-3 py-1 transition hover:bg-gray-50"
                                    >
                                      جعله الحالي
                                    </button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })
        )}
      </div>
    </main>
  )
}