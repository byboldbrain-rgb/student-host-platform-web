'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Squada_One } from 'next/font/google'
import { createClient } from '@/src/lib/supabase/client'
import { getMyPropertyReservationsAction } from '@/src/lib/actions/reservations'

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

type ReservationItem = {
  id: string | number
  created_at?: string | null
  total_price_egp?: number | null
  properties?:
    | {
        title_ar?: string | null
        title_en?: string | null
      }
    | Array<{
        title_ar?: string | null
        title_en?: string | null
      }>
    | null
}

type MenuFooterLink = {
  label: string
  href: string
  isEmail?: boolean
}

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

export default function AccountReservationsPage() {
  const currentYear = new Date().getFullYear()
  const supabase = useMemo(() => createClient(), [])

  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    async function loadAuthAndReservations() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setIsSignedIn(Boolean(user))
      } catch {
        setIsSignedIn(false)
      }

      try {
        const data = await getMyPropertyReservationsAction()
        setReservations(Array.isArray(data) ? data : [])
      } catch {
        setReservations([])
      } finally {
        setLoading(false)
      }
    }

    loadAuthAndReservations()
  }, [supabase])

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

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            margin-top: 6px;
            font-size: 14px;
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
          dir="rtl"
          className="min-h-screen bg-[linear-gradient(180deg,#f5f7fb_0%,#f7f7f8_40%,#f3f6ff_100%)] px-4 py-6 text-[#20212a] sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <section className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.05)] sm:p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#054aff]/[0.07] blur-3xl" />
                <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#6ea8ff]/[0.12] blur-3xl" />
              </div>

              <div className="relative z-10">
                <section className="relative overflow-hidden rounded-[30px] border border-[#dbe5ff] bg-gradient-to-l from-[#08152f] via-[#0b1f46] to-[#123a8f] p-5 text-white shadow-[0_16px_40px_rgba(8,21,47,0.18)] sm:p-6 lg:p-7">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#6ea8ff]/20 blur-2xl" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.08]" />
                  </div>

                  <div className="max-w-2xl">
                    <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-[2.2rem]">
                      حجوزاتي
                    </h1>
                  </div>
                </section>

                {loading ? (
                  <section className="mt-8 space-y-5">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
                      >
                        <div className="animate-pulse border-b border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:p-6">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 space-y-3">
                              <div className="h-7 w-48 rounded-xl bg-gray-200" />
                              <div className="h-4 w-36 rounded-xl bg-gray-100" />
                            </div>

                            <div className="xl:min-w-[180px] xl:max-w-[220px]">
                              <div className="rounded-[22px] border border-[#dbe5ff] bg-[#f3f6ff] p-4">
                                <div className="h-3 w-20 rounded bg-gray-200" />
                                <div className="mt-3 h-5 w-24 rounded bg-gray-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>
                ) : reservations.length === 0 ? (
                  <section className="mt-8">
                    <div className="rounded-[30px] border border-dashed border-[#cddcff] bg-[#f8fbff] p-8 text-center shadow-[0_10px_30px_rgba(5,74,255,0.06)] sm:p-10">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-[0_10px_24px_rgba(5,74,255,0.10)]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="h-9 w-9 text-[#054aff]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 6.75V4.5m7.5 2.25V4.5M4.5 9.75h15m-13.5 9h3m1.5 0h6.75M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z"
                          />
                        </svg>
                      </div>

                      <h2 className="mt-5 text-xl font-extrabold text-gray-900">
                        لا توجد حجوزات حتى الآن
                      </h2>
                      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-500">
                        بمجرد إنشاء أول حجز، ستظهر هنا تفاصيل العقار وتاريخ الإنشاء وإجمالي الحجز.
                      </p>

                      <div className="mt-6">
                        <Link
                          href="/account"
                          className="inline-flex items-center justify-center rounded-full bg-[#054aff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#003fd9]"
                        >
                          العودة إلى لوحة الحساب
                        </Link>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="mt-8 space-y-5">
                    {reservations.map((reservation) => {
                      const property = Array.isArray(reservation.properties)
                        ? reservation.properties[0]
                        : reservation.properties

                      const totalPrice = Number(reservation.total_price_egp ?? 0)

                      return (
                        <article
                          key={reservation.id}
                          className="group overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                        >
                          <div className="border-b border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0">
                                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                                  {property?.title_ar || property?.title_en || 'عقار'}
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                  تاريخ الإنشاء:{' '}
                                  <span className="font-semibold text-gray-700">
                                    {formatDate(reservation.created_at)}
                                  </span>
                                </p>
                              </div>

                              <div className="xl:min-w-[180px] xl:max-w-[220px]">
                                <div className="rounded-[22px] border border-[#dbe5ff] bg-[#f3f6ff] p-4">
                                  <p className="text-xs font-medium text-[#4d5b7c]">إجمالي الحجز</p>
                                  <p className="mt-2 text-sm font-extrabold text-[#0b1f46] sm:text-[15px]">
                                    {formatMoney(totalPrice)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </section>
                )}
              </div>
            </section>
          </div>
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