import Link from 'next/link'
import { getMyPropertyReservationsAction } from '@/src/lib/actions/reservations'

function formatMoney(value?: number | null) {
  return `${Number(value ?? 0).toFixed(2)} جنيه`
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleDateString('ar-EG')
  } catch {
    return value
  }
}

function formatReservationStatus(status?: string | null) {
  if (status === 'pending') return 'قيد الانتظار'
  if (status === 'reserved') return 'محجوز'
  if (status === 'checked_in') return 'تم السكن'
  if (status === 'completed') return 'مكتمل'
  if (status === 'cancelled') return 'ملغي'
  return status || '-'
}

function formatPaymentStatus(status?: string | null) {
  if (status === 'paid') return 'مدفوع بالكامل'
  if (status === 'partially_paid') return 'مدفوع جزئيًا'
  if (status === 'unpaid') return 'غير مدفوع'
  return status || '-'
}

function getPaymentStatusClass(status?: string | null) {
  if (status === 'paid') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'partially_paid') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  return 'border-red-200 bg-red-50 text-red-700'
}

export default async function AccountReservationsPage() {
  const reservations = await getMyPropertyReservationsAction()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">حجوزاتي</h1>
          <p className="mt-1 text-sm text-gray-600">
            متابعة الحجوزات وحالة الدفع والمبالغ المستخدمة من المحفظة.
          </p>
        </div>

        <Link
          href="/account"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          الرجوع إلى حسابي
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">لا توجد حجوزات حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation: any) => {
            const property = Array.isArray(reservation.properties)
              ? reservation.properties[0]
              : reservation.properties

            const totalPrice = Number(reservation.total_price_egp ?? 0)
            const walletAmountUsed = Number(reservation.wallet_amount_used ?? 0)
            const remainingAmount = Math.max(totalPrice - walletAmountUsed, 0)

            return (
              <div
                key={reservation.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {property?.title_ar || property?.title_en || 'عقار'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      رقم الحجز: {reservation.id}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusClass(
                      reservation.payment_status
                    )}`}
                  >
                    {formatPaymentStatus(reservation.payment_status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">إجمالي الحجز</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(totalPrice)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">المستخدم من المحفظة</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(walletAmountUsed)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">المتبقي</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(remainingAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">حالة الحجز</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatReservationStatus(reservation.status)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">نوع الحجز</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {reservation.reservation_scope || '-'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">تاريخ البداية</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(reservation.start_date)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">تاريخ النهاية</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(reservation.end_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  تم الإنشاء: {formatDate(reservation.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}