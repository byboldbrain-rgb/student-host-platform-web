import Link from 'next/link'
import { getMyReferralInfoAction } from '@/src/lib/actions/referrals'

function formatMoney(value?: number | null) {
  return `${Number(value ?? 0).toFixed(2)} جنيه`
}

function getInviterReward(item: any) {
  return Number(
    item.inviter_first_paid_bonus_amount ??
      item.inviter_reward_amount ??
      0
  )
}

function getInvitedSignupReward(item: any) {
  return Number(
    item.invited_signup_bonus_amount ??
      0
  )
}

function getInvitedFirstPaidReward(item: any) {
  return Number(
    item.invited_first_paid_bonus_amount ??
      item.invited_reward_amount ??
      0
  )
}

function getInvitedTotalReward(item: any) {
  return getInvitedSignupReward(item) + getInvitedFirstPaidReward(item)
}

function getDerivedReferralStatus(item: any) {
  if (item.status === 'cancelled') return 'cancelled'
  if (item.first_paid_bonus_rewarded_at || item.rewarded_at) return 'rewarded'
  if (item.qualified_at) return 'qualified'
  return 'pending'
}

function formatReferralStatus(status?: string | null) {
  if (status === 'pending') return 'قيد الانتظار'
  if (status === 'qualified') return 'مؤهلة'
  if (status === 'rewarded') return 'تمت المكافأة'
  if (status === 'cancelled') return 'ملغية'
  return 'غير معروف'
}

function getReferralStatusClass(status?: string | null) {
  if (status === 'pending') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  if (status === 'qualified') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'rewarded') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-700'
}

export default async function AccountReferralsPage() {
  const data = await getMyReferralInfoAction()

  const profile = data?.profile
  const referrals = data?.referrals ?? []

  const invitedByMe = referrals.filter(
    (item: any) => item.inviter_user_id === profile?.id
  )

  const totalInvites = invitedByMe.length

  const rewardedInvites = invitedByMe.filter((item: any) => {
    return getDerivedReferralStatus(item) === 'rewarded'
  }).length

  const qualifiedInvites = invitedByMe.filter((item: any) => {
    return getDerivedReferralStatus(item) === 'qualified'
  }).length

  const totalInviterRewards = invitedByMe.reduce((sum: number, item: any) => {
    return sum + getInviterReward(item)
  }, 0)

  const totalInvitedRewards = invitedByMe.reduce((sum: number, item: any) => {
    return sum + getInvitedTotalReward(item)
  }, 0)

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإحالات والدعوات</h1>
          <p className="mt-1 text-sm text-gray-600">
            شارك كود الدعوة الخاص بك وتابع حالة الإحالات والمكافآت.
          </p>
        </div>

        <Link
          href="/account"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          الرجوع إلى حسابي
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">كود الإحالة</p>
          <p className="mt-2 break-all text-2xl font-bold text-gray-900">
            {profile?.referral_code ?? '-'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">عدد الدعوات</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalInvites}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">دعوات تمت مكافأتها</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {rewardedInvites}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">دعوات مؤهلة حاليًا</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {qualifiedInvites}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي مكافآت المُحيل</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatMoney(totalInviterRewards)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي مكافآت المستخدمين المدعوين</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatMoney(totalInvitedRewards)}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">كيف يعمل النظام؟</h2>
          <p className="mt-1 text-sm text-gray-600">
            المستخدم الجديد يحصل على مكافأة إنشاء حساب، ولو استخدم كود إحالة
            يحصل على مكافأة إضافية، ثم عند أول حجز مدفوع له يتم صرف مكافأة
            أخرى له ولمالك الكود.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">كودك الحالي</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {profile?.referral_code ?? '-'}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          سجل الإحالات
        </h2>

        {invitedByMe.length === 0 ? (
          <p className="text-sm text-gray-500">
            لم يستخدم أحد كود الإحالة الخاص بك حتى الآن.
          </p>
        ) : (
          <div className="space-y-4">
            {invitedByMe.map((item: any) => {
              const derivedStatus = getDerivedReferralStatus(item)
              const inviterReward = getInviterReward(item)
              const invitedSignupReward = getInvitedSignupReward(item)
              const invitedFirstPaidReward = getInvitedFirstPaidReward(item)
              const invitedTotalReward = getInvitedTotalReward(item)

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">مستخدم مدعو</p>
                      <p className="mt-1 text-sm text-gray-500">
                        ID: {item.invited_user_id}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getReferralStatusClass(
                        derivedStatus
                      )}`}
                    >
                      {formatReferralStatus(derivedStatus)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">مكافأتك</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatMoney(inviterReward)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">مكافأة المدعو عند التسجيل</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatMoney(invitedSignupReward)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">مكافأة المدعو عند أول حجز مدفوع</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatMoney(invitedFirstPaidReward)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">إجمالي مكافآت المدعو</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatMoney(invitedTotalReward)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">تاريخ الإنشاء</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('ar-EG')
                          : '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">تاريخ التأهل</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {item.qualified_at
                          ? new Date(item.qualified_at).toLocaleString('ar-EG')
                          : '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">تاريخ مكافأة أول حجز مدفوع</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {item.first_paid_bonus_rewarded_at
                          ? new Date(item.first_paid_bonus_rewarded_at).toLocaleString('ar-EG')
                          : item.rewarded_at
                          ? new Date(item.rewarded_at).toLocaleString('ar-EG')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}