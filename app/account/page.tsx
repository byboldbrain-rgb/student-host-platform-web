'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { signOutUser } from '@/src/lib/supabase/user-auth'

type UserProfile = {
  id: string
  full_name: string | null
  phone: string | null
  email?: string | null
  referral_code?: string | null
  wallet_cached_balance?: number | null
} | null

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, full_name, phone, referral_code, wallet_cached_balance')
          .eq('id', user.id)
          .single()

        setProfile({
          id: user.id,
          full_name: profileData?.full_name ?? null,
          phone: profileData?.phone ?? null,
          referral_code: profileData?.referral_code ?? null,
          wallet_cached_balance: profileData?.wallet_cached_balance ?? 0,
          email: user.email,
        })
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  async function handleLogout() {
    try {
      setLogoutLoading(true)
      await signOutUser()
      router.push('/login')
      router.refresh()
    } finally {
      setLogoutLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border p-6">
          <p>جاري تحميل البيانات...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">حسابي</h1>

        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">الاسم:</span>{' '}
            {profile?.full_name ?? '-'}
          </p>

          <p>
            <span className="font-semibold">الإيميل:</span>{' '}
            {profile?.email ?? '-'}
          </p>

          <p>
            <span className="font-semibold">رقم الهاتف:</span>{' '}
            {profile?.phone ?? '-'}
          </p>

          <p>
            <span className="font-semibold">كود الإحالة:</span>{' '}
            {profile?.referral_code ?? '-'}
          </p>

          <p>
            <span className="font-semibold">الرصيد الحالي:</span>{' '}
            {Number(profile?.wallet_cached_balance ?? 0).toFixed(2)} جنيه
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/account/wallet"
            className="rounded-xl border border-gray-300 px-4 py-3 text-center font-medium transition hover:bg-gray-50"
          >
            المحفظة وطلبات الشحن
          </Link>

          <Link
            href="/account/reservations"
            className="rounded-xl border border-gray-300 px-4 py-3 text-center font-medium transition hover:bg-gray-50"
          >
            حجوزاتي
          </Link>

          <Link
            href="/account/referrals"
            className="rounded-xl border border-gray-300 px-4 py-3 text-center font-medium transition hover:bg-gray-50"
          >
            الإحالات والدعوات
          </Link>
        </div>

        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="mt-6 rounded-xl bg-black px-4 py-2 text-white"
        >
          {logoutLoading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
        </button>
      </div>
    </main>
  )
}