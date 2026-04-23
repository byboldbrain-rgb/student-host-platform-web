'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Squada_One } from 'next/font/google'
import { createClient } from '@/src/lib/supabase/client'
import { getMyReferralInfoAction } from '@/src/lib/actions/referrals'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

const socialMenuLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
]

const footerQuickLinks = [
  { label: 'About us', href: '/about' },
  { label: 'Board', href: '/board' },
  { label: 'Contact', href: '/contact' },
]

type MenuFooterLink = {
  label: string
  href: string
  isEmail?: boolean
}

function formatMoney(value?: number | null) {
  return `${Number(value ?? 0).toFixed(2)} EGP`
}

function getInviterReward(item: any) {
  return Number(item.inviter_first_paid_bonus_amount ?? item.inviter_reward_amount ?? 0)
}

function getInvitedSignupReward(item: any) {
  return Number(item.invited_signup_bonus_amount ?? 0)
}

function getInvitedFirstPaidReward(item: any) {
  return Number(item.invited_first_paid_bonus_amount ?? item.invited_reward_amount ?? 0)
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
  if (status === 'pending') return 'Pending'
  if (status === 'qualified') return 'Qualified'
  if (status === 'rewarded') return 'Rewarded'
  if (status === 'cancelled') return 'Cancelled'
  return 'Unknown'
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

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US')
}

export default function AccountReferralsPage() {
  const currentYear = new Date().getFullYear()
  const supabase = useMemo(() => createClient(), [])

  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    async function loadReferralInfo() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setIsSignedIn(Boolean(user))
      } catch {
        setIsSignedIn(false)
      }

      try {
        const result = await getMyReferralInfoAction()
        setData(result)
      } catch (error) {
        console.error('Failed to load referral info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferralInfo()
  }, [supabase])

  const profile = data?.profile
  const referrals = data?.referrals ?? []

  const invitedByMe = useMemo(() => {
    return referrals.filter((item: any) => item.inviter_user_id === profile?.id)
  }, [referrals, profile?.id])

  const totalInvites = invitedByMe.length

  const rewardedInvites = invitedByMe.filter((item: any) => {
    return getDerivedReferralStatus(item) === 'rewarded'
  }).length

  const qualifiedInvites = invitedByMe.filter((item: any) => {
    return getDerivedReferralStatus(item) === 'qualified'
  }).length

  const pendingInvites = invitedByMe.filter((item: any) => {
    return getDerivedReferralStatus(item) === 'pending'
  }).length

  const totalInviterRewards = invitedByMe.reduce((sum: number, item: any) => {
    return sum + getInviterReward(item)
  }, 0)

  const totalInvitedRewards = invitedByMe.reduce((sum: number, item: any) => {
    return sum + getInvitedTotalReward(item)
  }, 0)

  const referralCode = profile?.referral_code ?? '-'

  const primaryMenuLinks = [
    {
      label: isSignedIn ? 'Account' : 'Log in or sign up',
      href: isSignedIn ? '/account' : '/login',
    },
    { label: 'Community', href: '/community/join' },
  ]

  const menuFooterLinks: MenuFooterLink[] = [
    ...footerQuickLinks,
    { label: 'info@navienty.com', href: 'mailto:info@navienty.com', isEmail: true },
  ]

  return (
    <>
      <style jsx global>{`
        :root {
          --menu-blue: #054aff;
          --menu-cream: #f2ead8;
          --menu-cream-soft: rgba(242, 234, 216, 0.92);
        }

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .menu-trigger {
          width: 40px;
          height: 40px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 0;
          padding: 0;
        }

        .menu-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .menu-trigger-lines {
          position: relative;
          width: 26px;
          height: 10px;
          display: block;
        }

        .menu-trigger-lines span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: #000000;
          border-radius: 2px;
        }

        .menu-trigger-lines span:nth-child(1) {
          top: 0;
        }

        .menu-trigger-lines span:nth-child(2) {
          bottom: 0;
        }

        .mega-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 140;
          background: var(--menu-blue);
          color: var(--menu-cream);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
          transition:
            opacity 0.26s ease,
            visibility 0.26s ease,
            transform 0.26s ease;
        }

        .mega-menu-overlay.is-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .mega-menu-wrap {
          position: relative;
          min-height: 100dvh;
          padding: 38px 56px 38px;
        }

        .mega-menu-top {
          position: absolute;
          left: 56px;
          right: 56px;
          top: 36px;
          height: 56px;
          z-index: 3;
        }

        .mega-menu-close {
          position: absolute;
          right: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          color: var(--menu-cream);
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.02em;
          background: transparent;
          border: 0;
          padding: 0;
          z-index: 5;
        }

        .mega-menu-close-line {
          width: 46px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          display: inline-block;
          transform: translateY(-1px);
        }

        .mega-menu-logo {
          position: absolute;
          left: 50%;
          top: -60px;
          transform: translateX(-50%);
          z-index: 2;
        }

        .mega-menu-logo img {
          width: 160px;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .mega-menu-body {
          position: relative;
          min-height: calc(100dvh - 76px);
          padding-top: 100px;
          width: 100%;
          padding-left: 56px;
          padding-right: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mega-menu-left {
          position: absolute;
          left: 56px;
          bottom: 36px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 220px;
          min-width: 220px;
          min-height: auto;
        }

        .mega-menu-left-spacer {
          display: none;
        }

        .mega-menu-left-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding-bottom: 0;
        }

        .mega-menu-small-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-size: 22px;
          line-height: 1.28;
          font-weight: 600;
          letter-spacing: -0.03em;
          display: block;
          width: fit-content;
        }

        .mega-menu-small-link:hover {
          opacity: 0.88;
        }

        .mega-menu-right {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-width: 0;
          padding-top: 0;
          transform: translateY(-100px);
        }

        .mega-menu-main-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 100%;
          max-width: 900px;
          text-align: center;
        }

        .mega-menu-main-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-weight: 600;
          font-size: 64px;
          line-height: 1.15;
          letter-spacing: -0.075em;
          display: block;
          width: fit-content;
        }

        .mega-menu-main-link:hover {
          opacity: 0.9;
        }

        .mega-menu-footer-links {
          position: absolute;
          right: 56px;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          max-width: 240px;
          text-align: right;
        }

        .mega-menu-footer-link {
          color: rgba(242, 234, 216, 0.88);
          text-decoration: none;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 500;
          letter-spacing: -0.02em;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .mega-menu-footer-link:hover {
          opacity: 1;
          color: var(--menu-cream);
          transform: translateX(-2px);
        }

        .mega-menu-footer-link--email {
          margin-top: 8px;
          opacity: 0.76;
          font-size: 16px;
        }

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
        }

        .footer-esaf-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 34px;
        }

        .footer-esaf-top {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px 280px;
          gap: 72px;
          align-items: start;
        }

        .footer-esaf-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-transform: uppercase;
        }

        .footer-esaf-heading {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .footer-esaf-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-esaf-link {
          display: inline-block;
          width: fit-content;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 8px;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-link:hover {
          opacity: 0.78;
        }

        .footer-esaf-email {
          display: inline-block;
          color: #ffffff;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-email:hover {
          opacity: 0.78;
        }

        .footer-esaf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
          padding-top: 92px;
        }

        .footer-esaf-copyright {
          margin: 0;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          letter-spacing: -0.02em;
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: none;
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.08);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 64px;
          padding: 0 8px;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #6b7280;
          min-height: 100%;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item:hover {
          color: #111827;
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        @media (max-width: 1100px) {
          .footer-esaf-top {
            grid-template-columns: 1fr 1fr;
            gap: 48px 36px;
          }

          .footer-esaf-top-left {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1024px) {
          .mega-menu-wrap {
            padding: 26px 24px 28px;
            overflow-y: auto;
          }

          .mega-menu-top {
            left: 24px;
            right: 24px;
            top: 24px;
            height: 40px;
          }

          .mega-menu-close {
            right: 0;
            top: 0;
            font-size: 16px;
            gap: 12px;
          }

          .mega-menu-close-line {
            width: 34px;
          }

          .mega-menu-logo {
            top: 68px;
          }

          .mega-menu-logo img {
            width: 74px;
            height: 74px;
          }

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 180px;
          }

          .mega-menu-left {
            position: absolute;
            left: 24px;
            bottom: 28px;
            width: auto;
            min-width: 0;
          }

          .mega-menu-left-bottom {
            width: 100%;
            padding-bottom: 0;
            gap: 12px;
          }

          .mega-menu-right {
            width: 100%;
            min-width: 0;
            padding-top: 0;
            transform: translateY(-40px);
          }

          .mega-menu-main-links {
            gap: 6px;
            max-width: 100%;
          }

          .mega-menu-main-link {
            font-size: clamp(54px, 14.4vw, 86px);
            line-height: 1.05;
            white-space: normal;
          }

          .mega-menu-small-link {
            font-size: 24px;
          }

          .mega-menu-footer-links {
            right: 24px;
            bottom: 12px;
            max-width: 220px;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            font-size: 15px;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }

          .menu-trigger {
            display: none !important;
          }

          .mobile-bottom-nav {
            display: block;
          }

          .mega-menu-body {
            padding-bottom: 220px;
          }

          .mega-menu-footer-links {
            left: 24px;
            right: 24px;
            bottom: 76px;
            align-items: flex-start;
            text-align: left;
            max-width: none;
            gap: 8px;
          }

          .footer-esaf-container {
            padding: 48px 22px 28px;
          }

          .footer-esaf-top {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .footer-esaf-title {
            font-size: 36px;
          }

          .footer-esaf-heading {
            font-size: 22px;
            margin-bottom: 14px;
          }

          .footer-esaf-link,
          .footer-esaf-email {
            font-size: 17px;
          }

          .footer-esaf-bottom {
            padding-top: 56px;
            gap: 26px;
          }

          .footer-esaf-copyright {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <Link
              href="/properties?lang=en&currency=EGP"
              className="navienty-logo mt-2"
              aria-label="Navienty home"
              onClick={() => setMenuOpen(false)}
            >
              <img
                src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
                alt="Navienty icon"
                className="navienty-logo-icon"
              />
              <span className="navienty-logo-text-wrap">
                <img
                  src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
                  alt="Navienty"
                  className="navienty-logo-text"
                />
              </span>
            </Link>

            <button
              type="button"
              className="menu-trigger ml-auto"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="account-mega-menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="menu-trigger-lines">
                <span className="bg-black" />
                <span className="bg-black" />
              </span>
            </button>
          </div>
        </header>

        <div
          id="account-mega-menu"
          className={`mega-menu-overlay ${menuOpen ? 'is-open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <div className="mega-menu-wrap">
            <div className="mega-menu-top">
              <button
                type="button"
                className="mega-menu-close"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <span className="mega-menu-close-line" />
                <span>Close</span>
              </button>

              <div className="mega-menu-logo">
                <Link
                  href="/properties?lang=en&currency=EGP"
                  aria-label="Navienty home"
                  onClick={() => setMenuOpen(false)}
                >
                  <img
                    src="https://i.ibb.co/5gYVYQSR/Navienty-1.jpg"
                    alt="Navienty"
                  />
                </Link>
              </div>
            </div>

            <div className="mega-menu-body">
              <div className="mega-menu-left">
                <div className="mega-menu-left-spacer" />
                <div className="mega-menu-left-bottom">
                  {socialMenuLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mega-menu-small-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mega-menu-right">
                <div className="mega-menu-main-links">
                  {primaryMenuLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="mega-menu-main-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mega-menu-footer-links">
                {menuFooterLinks.map((item) =>
                  item.isEmail ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className="mega-menu-footer-link mega-menu-footer-link--email"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="mega-menu-footer-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <main
          dir="ltr"
          className="min-h-screen bg-[#f7f7f8] px-4 py-6 text-[#20212a] sm:px-6 lg:px-8"
        >
          {loading ? (
            <div className="mx-auto max-w-6xl animate-pulse">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-8">
                <div className="h-72 rounded-[32px] bg-gray-100" />
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-28 rounded-[28px] bg-gray-100" />
                  ))}
                </div>
                <div className="mt-8 h-72 rounded-[28px] bg-gray-100" />
                <div className="mt-8 h-[420px] rounded-[28px] bg-gray-100" />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-8">
                <div className="grid gap-4">
                  <section className="relative overflow-hidden rounded-[32px] border border-[#d9e5ff] bg-[radial-gradient(circle_at_top_right,rgba(114,165,255,0.24),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,#123b93_0%,#0b2256_48%,#07152f_100%)] px-5 py-6 text-white shadow-[0_18px_45px_rgba(8,21,47,0.20)] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -top-20 left-[-30px] h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute bottom-[-60px] right-[-10px] h-56 w-56 rounded-full bg-[#78a9ff]/20 blur-3xl" />
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.08]" />
                    </div>

                    <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_390px] lg:items-center">
                      <div>
                        <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.7rem] lg:leading-[1.15]">
                          Referrals & Invites
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-8 text-white/80 sm:text-base">
                          Share your referral code with friends and track invites, rewards, and
                          the status of each referral from one clear and professional dashboard.
                        </p>
                      </div>

                      <div className="mx-auto w-full max-w-[390px]">
                        <div className="rounded-[30px] border border-white/15 bg-white/12 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-4">
                          <div className="rounded-[28px] border border-[#d7e2ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(245,248,255,0.97)_100%)] p-5 text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
                            <div>
                              <p className="text-xs font-bold tracking-wide text-[#7b8798]">
                                Your Referral Code
                              </p>
                              <h2 className="mt-2 break-all text-[1.7rem] font-black tracking-[0.04em] text-[#101828] sm:text-[1.95rem]">
                                {referralCode}
                              </h2>
                            </div>

                            <div className="mt-4 grid gap-3">
                              <div className="rounded-[22px] border border-[#e4ebfb] bg-[#f8fbff] p-4">
                                <div>
                                  <p className="text-sm font-semibold text-[#6b7280]">
                                    Total Referrer Rewards
                                  </p>
                                  <p className="mt-2 text-2xl font-black text-[#101828]">
                                    {formatMoney(totalInviterRewards)}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-[22px] border border-[#e4ebfb] bg-[#f8fbff] p-4">
                                <div>
                                  <p className="text-sm font-semibold leading-6 text-[#6b7280]">
                                    Total Invited Users Rewards
                                  </p>
                                  <p className="mt-2 text-2xl font-black text-[#101828]">
                                    {formatMoney(totalInvitedRewards)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="mt-8">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                      <p className="text-sm font-medium text-[#6b7280]">Total Invites</p>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
                        {totalInvites}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                      <p className="text-sm font-medium text-[#6b7280]">Rewarded Invites</p>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
                        {rewardedInvites}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                      <p className="text-sm font-medium text-[#6b7280]">Currently Qualified</p>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
                        {qualifiedInvites}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                      <p className="text-sm font-medium text-[#6b7280]">Pending Invites</p>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
                        {pendingInvites}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-8">
                  <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:p-6">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-[#111827]">
                        How does the referral system work?
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[#5b6475]">
                        A new user receives a reward when creating an account, and if they use a
                        referral code, they get additional benefits. When the first paid booking is
                        completed, an extra reward is granted to both the invited user and the code
                        owner.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-[22px] border border-[#edf1f7] bg-[#fafcff] p-4">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#054aff] text-sm font-bold text-white">
                          1
                        </div>
                        <h3 className="text-sm font-bold text-[#111827]">Share the Code</h3>
                        <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                          Send your referral code to any new user on the platform.
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-[#edf1f7] bg-[#fafcff] p-4">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#054aff] text-sm font-bold text-white">
                          2
                        </div>
                        <h3 className="text-sm font-bold text-[#111827]">Sign Up & Qualify</h3>
                        <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                          When the invited user uses the code and meets the conditions, the referral
                          becomes qualified.
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-[#edf1f7] bg-[#fafcff] p-4">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#054aff] text-sm font-bold text-white">
                          3
                        </div>
                        <h3 className="text-sm font-bold text-[#111827]">Receive Rewards</h3>
                        <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                          Final rewards are calculated after the invited user completes their first
                          paid booking.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-8 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:p-6">
                  <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-[#111827]">
                        Referral History
                      </h2>
                      <p className="mt-1 text-sm text-[#6b7280]">
                        All users who used your referral code and the status of each referral.
                      </p>
                    </div>

                    <div className="rounded-full bg-[#f7f9fc] px-4 py-2 text-xs font-semibold text-[#5b6475]">
                      Total Records: {invitedByMe.length}
                    </div>
                  </div>

                  {invitedByMe.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-[#d7dce5] bg-[#fafbfd] px-6 py-12 text-center">
                      <h3 className="text-lg font-bold text-[#111827]">No referrals yet</h3>
                      <p className="mt-2 text-sm leading-7 text-[#6b7280]">
                        No one has used your referral code yet. Start sharing it with your friends
                        to increase your chances of earning rewards.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invitedByMe.map((item: any) => {
                        const derivedStatus = getDerivedReferralStatus(item)
                        const inviterReward = getInviterReward(item)
                        const invitedSignupReward = getInvitedSignupReward(item)
                        const invitedFirstPaidReward = getInvitedFirstPaidReward(item)
                        const invitedTotalReward = getInvitedTotalReward(item)

                        return (
                          <article
                            key={item.id}
                            className="overflow-hidden rounded-[26px] border border-[#e9edf5] bg-[#fcfdff] transition hover:shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
                          >
                            <div className="flex flex-col gap-4 border-b border-[#edf1f7] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                              <div className="min-w-0">
                                <div className="min-w-0">
                                  <p className="text-base font-bold text-[#111827]">Invited User</p>
                                  <p className="mt-1 truncate text-sm text-[#6b7280]">
                                    ID: {item.invited_user_id}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${getReferralStatusClass(
                                  derivedStatus
                                )}`}
                              >
                                {formatReferralStatus(derivedStatus)}
                              </span>
                            </div>

                            <div className="px-5 py-5 sm:px-6">
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-[20px] border border-[#edf1f7] bg-white p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">Your Reward</p>
                                  <p className="mt-2 text-base font-extrabold text-[#111827]">
                                    {formatMoney(inviterReward)}
                                  </p>
                                </div>

                                <div className="rounded-[20px] border border-[#edf1f7] bg-white p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">
                                    Invited User Signup Reward
                                  </p>
                                  <p className="mt-2 text-base font-extrabold text-[#111827]">
                                    {formatMoney(invitedSignupReward)}
                                  </p>
                                </div>

                                <div className="rounded-[20px] border border-[#edf1f7] bg-white p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">
                                    Invited User First Paid Booking Reward
                                  </p>
                                  <p className="mt-2 text-base font-extrabold text-[#111827]">
                                    {formatMoney(invitedFirstPaidReward)}
                                  </p>
                                </div>

                                <div className="rounded-[20px] border border-[#edf1f7] bg-white p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">
                                    Total Invited User Rewards
                                  </p>
                                  <p className="mt-2 text-base font-extrabold text-[#111827]">
                                    {formatMoney(invitedTotalReward)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-[20px] border border-[#edf1f7] bg-[#fafcff] p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">Created At</p>
                                  <p className="mt-2 text-sm font-bold text-[#111827]">
                                    {formatDate(item.created_at)}
                                  </p>
                                </div>

                                <div className="rounded-[20px] border border-[#edf1f7] bg-[#fafcff] p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">Qualified At</p>
                                  <p className="mt-2 text-sm font-bold text-[#111827]">
                                    {formatDate(item.qualified_at)}
                                  </p>
                                </div>

                                <div className="rounded-[20px] border border-[#edf1f7] bg-[#fafcff] p-4">
                                  <p className="text-xs font-medium text-[#6b7280]">
                                    First Paid Reward Date
                                  </p>
                                  <p className="mt-2 text-sm font-bold text-[#111827]">
                                    {formatDate(
                                      item.first_paid_bonus_rewarded_at ?? item.rewarded_at
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>

        <footer className="footer-esaf hidden md:block">
          <div className="footer-esaf-container">
            <div className="footer-esaf-top">
              <div className="footer-esaf-top-left">
                <h2 className={`${squadaOne.className} footer-esaf-title`}>
                  Find your way to better student living
                </h2>
              </div>

              <div>
                <h3 className="footer-esaf-heading">Quick Links</h3>
                <div className="footer-esaf-links">
                  {footerQuickLinks.map((item) => (
                    <Link key={item.label} href={item.href} className="footer-esaf-link">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="footer-esaf-heading">Contact Us</h3>
                <a href="mailto:info@navienty.com" className="footer-esaf-email">
                  info@navienty.com
                </a>
              </div>
            </div>

            <div className="footer-esaf-bottom">
              <p className="footer-esaf-copyright">
                © {currentYear} Navienty | All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
          <div className="mobile-bottom-nav__inner">
            <Link href="/properties" className="mobile-bottom-nav__item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.9}
                stroke="currentColor"
                className="mobile-bottom-nav__icon"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 16l4 4" />
              </svg>
              <span className="mobile-bottom-nav__label">Explore</span>
            </Link>

            <Link href="/community" className="mobile-bottom-nav__item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.9}
                stroke="currentColor"
                className="mobile-bottom-nav__icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25s-6.75-4.35-9-8.25C1.2 8.7 3.3 4.5 7.5 4.5c2.1 0 3.45 1.2 4.5 2.55 1.05-1.35 2.4-2.55 4.5-2.55 4.2 0 6.3 4.2 4.5 7.5-2.25 3.9-9 8.25-9 8.25Z"
                />
              </svg>
              <span className="mobile-bottom-nav__label">Community</span>
            </Link>

            <Link
              href="/account"
              className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.9}
                stroke="currentColor"
                className="mobile-bottom-nav__icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
                />
              </svg>
              <span className="mobile-bottom-nav__label">Account</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}