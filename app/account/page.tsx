'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Squada_One } from 'next/font/google'
import { createClient } from '@/src/lib/supabase/client'
import { signOutUser } from '@/src/lib/supabase/user-auth'

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
  const supabase = useMemo(() => createClient(), [])
  const currentYear = new Date().getFullYear()

  const [profile, setProfile] = useState<UserProfile>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showWalletBalance, setShowWalletBalance] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const defaultLanguage = 'en'
  const defaultCurrency = 'EGP'
  const propertiesHref = `/properties?lang=${defaultLanguage}&currency=${defaultCurrency}`
  const communityHref = `/community?lang=${defaultLanguage}&currency=${defaultCurrency}`
  const accountHref = `/account?lang=${defaultLanguage}&currency=${defaultCurrency}`

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

  const firstName = useMemo(() => {
    const name = profile?.full_name?.trim()
    if (!name) return 'ضيفنا'
    return name.split(' ')[0]
  }, [profile?.full_name])

  const walletBalance = Number(profile?.wallet_cached_balance ?? 0).toFixed(2)

  const primaryMenuLinks = [
    {
      label: !loading && profile ? 'Account' : 'Log in or sign up',
      href: !loading && profile ? accountHref : `/login?lang=${defaultLanguage}&currency=${defaultCurrency}`,
    },
    { label: 'Community', href: communityHref },
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

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.55);
          transition: filter 0.2s ease;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .account-wallet-section {
          overflow: hidden;
        }

        .wallet-button-wrapper {
          text-decoration: none;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
        }

        .wallet-demo {
          position: relative;
          width: 100%;
          max-width: 280px;
          height: 230px;
          margin: 0 auto;
          perspective: 1000px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        @keyframes slideIntoPocket {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .wallet-back {
          position: absolute;
          bottom: 0;
          width: 280px;
          height: 200px;
          background: #1e341e;
          border-radius: 22px 22px 60px 60px;
          z-index: 5;
          box-shadow:
            inset 0 25px 35px rgba(0, 0, 0, 0.4),
            inset 0 5px 15px rgba(0, 0, 0, 0.5);
        }

        .wallet-card {
          position: absolute;
          width: 260px;
          height: 140px;
          left: 10px;
          border-radius: 16px;
          padding: 18px;
          color: white;
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            0 -4px 15px rgba(0, 0, 0, 0.1);
          animation: slideIntoPocket 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
        }

        .wallet-card-inner {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .wallet-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .chip {
          width: 32px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .wallet-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 10px;
        }

        .wallet-card-info {
          min-width: 0;
          flex: 1;
        }

        .label {
          font-size: 8px;
          opacity: 0.7;
          text-transform: uppercase;
          margin-bottom: 2px;
          display: block;
        }

        .value {
          display: block;
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .wallet-card-number-wrapper {
          text-align: right;
          flex-shrink: 0;
        }

        .hidden-stars {
          font-size: 16px;
          letter-spacing: 2px;
        }

        .card-number {
          display: block;
          font-size: 14px;
          letter-spacing: 1px;
          font-family: monospace;
          opacity: 0.85;
        }

        .stripe {
          background: #635bff;
          bottom: 90px;
          z-index: 10;
          animation-delay: 0.1s;
        }

        .wise {
          background: #9bd86a;
          bottom: 65px;
          z-index: 20;
          animation-delay: 0.2s;
        }

        .paypal {
          background: #ffffff;
          color: #003087;
          bottom: 40px;
          z-index: 30;
          animation-delay: 0.3s;
        }

        .paypal .chip {
          background: rgba(0, 0, 0, 0.05);
        }

        .paypal .label {
          color: #8c979d;
        }

        .pocket {
          position: absolute;
          bottom: 0;
          width: 280px;
          height: 160px;
          z-index: 40;
          filter: drop-shadow(0 15px 25px rgba(20, 40, 20, 0.4));
        }

        .pocket-content {
          position: absolute;
          top: 45px;
          width: 100%;
          text-align: center;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .balance-stars {
          color: #839e7b;
          font-size: 24px;
          letter-spacing: 4px;
          transition: 0.3s;
          opacity: 1;
        }

        .hidden-balance {
          opacity: 0;
        }

        .balance-real {
          color: #a7c59e;
          font-size: 22px;
          font-weight: 600;
          opacity: 0;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, 10px);
          transition: 0.3s;
          white-space: nowrap;
        }

        .show-balance {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        .wallet-balance-label {
          color: #698263;
          font-size: 12px;
          font-weight: 500;
        }

        .eye-icon-wrapper {
          margin-top: 8px;
          height: 20px;
          width: 20px;
          position: relative;
          opacity: 0.8;
          transition: 0.3s;
        }

        .icon-visible {
          opacity: 1;
        }

        .eye-icon {
          position: absolute;
          top: 0;
          left: 0;
          stroke: #3be60b;
          transition: 0.3s;
        }

        .eye-slash {
          opacity: 1;
          transform: scale(1);
        }

        .eye-open {
          opacity: 0;
          transform: scale(0.8);
        }

        .hide-eye {
          opacity: 0;
          transform: scale(0.5);
        }

        .show-eye {
          opacity: 1;
          transform: scale(1.1);
        }

        .wallet-hover-hint {
          margin-top: 2px;
          font-size: 11px;
          font-weight: 600;
          color: #88a57f;
        }

        .account-menu-icon {
          width: 24px;
          height: 24px;
          object-fit: contain;
          display: block;
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

          .wallet-demo {
            transform: scale(0.96);
            transform-origin: center;
          }
        }
      `}</style>

      <div className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <Link
              href={propertiesHref}
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
                  href={propertiesHref}
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
          className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222222] sm:px-6 lg:px-8"
        >
          {loading ? (
            <div className="mx-auto max-w-6xl animate-pulse">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-[24px] bg-gray-200" />
                    <div className="space-y-3">
                      <div className="h-7 w-40 rounded-xl bg-gray-200" />
                      <div className="h-4 w-64 rounded-xl bg-gray-100" />
                    </div>
                  </div>
                  <div className="h-24 w-full rounded-[24px] bg-gray-100 lg:w-[320px]" />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-[28px] border border-gray-100 bg-white p-5">
                      <div className="h-12 w-12 rounded-[18px] bg-gray-100" />
                      <div className="mt-4 h-5 w-36 rounded bg-gray-200" />
                      <div className="mt-3 h-4 w-full rounded bg-gray-100" />
                      <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-8">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <section className="relative overflow-hidden rounded-[30px] border border-[#dbe5ff] bg-gradient-to-l from-[#08152f] via-[#0b1f46] to-[#123a8f] p-5 text-white shadow-[0_16px_40px_rgba(8,21,47,0.18)] sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#6ea8ff]/20 blur-2xl" />
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.08]" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="min-w-0">
                              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                                Welcome {firstName}
                              </h1>

                              <button
                                type="button"
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {logoutLoading ? (
                                  <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                                      />
                                    </svg>
                                    <span>Logging out...</span>
                                  </>
                                ) : (
                                  <>
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
                                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-7.5a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6 21h7.5a2.25 2.25 0 0 0 2.25-2.25V15M18 12H9m0 0 3.75-3.75M9 12l3.75 3.75"
                                      />
                                    </svg>
                                    <span>Log Out</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="referral-hero-card rounded-[26px] border border-white/12 bg-white/[0.10] px-5 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-6 sm:py-6 lg:max-w-[420px]">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/12 ring-1 ring-white/12 sm:h-16 sm:w-16">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className="h-6 w-6 text-white sm:h-7 sm:w-7"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7.5 8.25h9m-9 3h6m-7.875 8.25h12.75A2.625 2.625 0 0 0 21 16.875V7.125A2.625 2.625 0 0 0 18.375 4.5H5.625A2.625 2.625 0 0 0 3 7.125v9.75A2.625 2.625 0 0 0 5.625 19.5Z"
                                />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white/70 sm:text-[15px]">
                                Referral Code
                              </p>
                              <p className="mt-2 referral-code-text truncate font-extrabold text-white">
                                {profile?.referral_code ?? '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="account-wallet-section rounded-[28px] bg-[#f3f6ff] p-4 shadow-[0_12px_30px_rgba(5,74,255,0.12)] sm:p-5">
                    <button
                      type="button"
                      onClick={() => setShowWalletBalance((prev) => !prev)}
                      className="wallet-button-wrapper block w-full rounded-[24px] text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#054aff]"
                      aria-label="إظهار أو إخفاء رصيد المحفظة"
                    >
                      <div className={`wallet-demo ${showWalletBalance ? 'is-open' : ''}`}>
                        <div className="wallet-back" />

                        <div className="wallet-card stripe">
                          <div className="wallet-card-inner">
                            <div className="wallet-card-top">
                              <span>Stripe</span>
                              <div className="chip" />
                            </div>

                            <div className="wallet-card-bottom">
                              <div className="wallet-card-info">
                                <span className="label">Holder</span>
                                <span className="value">
                                  {profile?.full_name?.toUpperCase() ?? 'ACCOUNT USER'}
                                </span>
                              </div>

                              <div className="wallet-card-number-wrapper">
                                <span className="hidden-stars">**** 4242</span>
                                <span className="card-number">5524 9910 4242</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="wallet-card wise">
                          <div className="wallet-card-inner">
                            <div className="wallet-card-top">
                              <span>Wallet</span>
                              <div className="chip" />
                            </div>

                            <div className="wallet-card-bottom">
                              <div className="wallet-card-info">
                                <span className="label">Status</span>
                                <span className="value">ACTIVE ACCOUNT</span>
                              </div>

                              <div className="wallet-card-number-wrapper">
                                <span className="hidden-stars">**** 8810</span>
                                <span className="card-number">9012 4432 8810</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="wallet-card paypal">
                          <div className="wallet-card-inner">
                            <div className="wallet-card-top">
                              <span>
                                Navi<b style={{ color: '#0079C1' }}>enty</b>
                              </span>
                              <div className="chip" />
                            </div>

                            <div className="wallet-card-bottom">
                              <div className="wallet-card-info">
                                <span className="label">Email</span>
                                <span className="value">{profile?.email ?? 'hello@work.com'}</span>
                              </div>

                              <div className="wallet-card-number-wrapper">
                                <span className="hidden-stars">**** 0094</span>
                                <span className="card-number">3312 0045 0094</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pocket">
                          <svg className="pocket-svg" viewBox="0 0 280 160" fill="none">
                            <path
                              d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                              fill="#1e341e"
                            />
                            <path
                              d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                              stroke="#353556"
                              strokeWidth="1.5"
                              strokeDasharray="6 4"
                            />
                          </svg>

                          <div className="pocket-content">
                            <div style={{ position: 'relative', height: 24, width: '100%' }}>
                              <div
                                className={`balance-stars ${
                                  showWalletBalance ? 'hidden-balance' : ''
                                }`}
                              >
                                ******
                              </div>
                              <div
                                className={`balance-real ${
                                  showWalletBalance ? 'show-balance' : ''
                                }`}
                              >
                                EGP {walletBalance}
                              </div>
                            </div>

                            <div className="wallet-balance-label">Total Balance</div>

                            <div
                              className={`eye-icon-wrapper ${
                                showWalletBalance ? 'icon-visible' : ''
                              }`}
                            >
                              <svg
                                className={`eye-icon eye-slash ${
                                  showWalletBalance ? 'hide-eye' : ''
                                }`}
                                width={20}
                                height={20}
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx={12} cy={12} r={3} />
                                <line x1={3} y1={3} x2={21} y2={21} />
                              </svg>

                              <svg
                                className={`eye-icon eye-open ${
                                  showWalletBalance ? 'show-eye' : ''
                                }`}
                                width={20}
                                height={20}
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx={12} cy={12} r={3} />
                              </svg>
                            </div>

                            <span className="wallet-hover-hint">
                              {showWalletBalance ? 'Tap to hide balance' : 'Tap to view balance'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </section>
                </div>

                <section className="mt-8">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Link
                      href="/account/wallet"
                      className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff]">
                          <img
                            src="https://i.ibb.co/zT33t0Rq/wallet-2527543.png"
                            alt="Add Balance icon"
                            className="account-menu-icon"
                          />
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-gray-900">Add Balance</h3>
                    </Link>

                    <Link
                      href="/account/reservations"
                      className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff]">
                          <img
                            src="https://i.ibb.co/BHkWcRkv/calendar.png"
                            alt="Reservations icon"
                            className="account-menu-icon"
                          />
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-gray-900">Reservations</h3>
                    </Link>

                    <Link
                      href="/account/referrals"
                      className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff]">
                          <img
                            src="https://i.ibb.co/67crQTMN/envelope.png"
                            alt="Referrals and Invitations icon"
                            className="account-menu-icon"
                          />
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-gray-900">
                        Referrals and Invitations
                      </h3>
                    </Link>
                  </div>
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
            <Link href={propertiesHref} className="mobile-bottom-nav__item">
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
              <span className="mobile-bottom-nav__label">Search</span>
            </Link>

            <Link href={communityHref} className="mobile-bottom-nav__item">
              <img
                src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
                alt="Community"
                className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
              />
              <span className="mobile-bottom-nav__label">Community</span>
            </Link>

            <Link href={accountHref} className="mobile-bottom-nav__item mobile-bottom-nav__item--active">
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