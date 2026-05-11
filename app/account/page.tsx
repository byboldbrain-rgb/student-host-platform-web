'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Squada_One } from 'next/font/google'
import { createClient } from '@/src/lib/supabase/client'
import { signOutUser } from '@/src/lib/supabase/user-auth'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

type SupportedLanguage = 'en' | 'ar'

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
  wallet_cached_balance?: number | null
} | null

const defaultCurrency = 'EGP'

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    guest: 'Guest',
    logOut: 'Log Out',
    loggingOut: 'Logging out...',
    addBalance: 'Add Balance',
    reservations: 'Reservations',
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    currentLanguage: 'Current language',
    account: 'Account',
    login: 'Log in or sign up',
    community: 'Community',
    search: 'Search',
    close: 'Close',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedIn: 'LinkedIn',
    aboutUs: 'About us',
    board: 'Board',
    contact: 'Contact',
    quickLinks: 'Quick Links',
    contactUs: 'Contact Us',
    footerTitle: 'Find your way to better student living',
    copyright: 'All rights reserved.',
    holder: 'Holder',
    status: 'Status',
    activeAccount: 'ACTIVE ACCOUNT',
    email: 'Email',
    totalBalance: 'Total Balance',
    tapToHideBalance: 'Tap to hide balance',
    tapToViewBalance: 'Tap to view balance',
    walletAriaLabel: 'Show or hide wallet balance',
  },
  ar: {
    welcome: 'مرحبًا',
    guest: 'ضيفنا',
    logOut: 'تسجيل الخروج',
    loggingOut: 'جاري تسجيل الخروج...',
    addBalance: 'إضافة رصيد',
    reservations: 'الحجوزات',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    currentLanguage: 'اللغة الحالية',
    account: 'الحساب',
    login: 'تسجيل الدخول أو إنشاء حساب',
    community: 'المجتمع',
    search: 'بحث',
    close: 'إغلاق',
    facebook: 'فيسبوك',
    instagram: 'إنستجرام',
    linkedIn: 'لينكدإن',
    aboutUs: 'من نحن',
    board: 'الإدارة',
    contact: 'تواصل معنا',
    quickLinks: 'روابط سريعة',
    contactUs: 'تواصل معنا',
    footerTitle: 'نظرة إلى المستقبل.',
    copyright: 'جميع الحقوق محفوظة.',
    holder: 'الاسم',
    status: 'الحالة',
    activeAccount: 'حساب نشط',
    email: 'البريد الإلكتروني',
    totalBalance: 'إجمالي الرصيد',
    tapToHideBalance: 'اضغط لإخفاء الرصيد',
    tapToViewBalance: 'اضغط لعرض الرصيد',
    walletAriaLabel: 'إظهار أو إخفاء رصيد المحفظة',
  },
} as const

function normalizeLanguage(value?: string | null): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function AccountPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const currentYear = new Date().getFullYear()

  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [profile, setProfile] = useState<UserProfile>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showWalletBalance, setShowWalletBalance] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const t = TRANSLATIONS[language]
  const isArabic = language === 'ar'

  useEffect(() => {
    const urlLang = normalizeLanguage(searchParams.get('lang'))
    const savedLang =
      typeof window !== 'undefined'
        ? normalizeLanguage(window.localStorage.getItem('navienty_lang'))
        : 'en'

    const nextLang = searchParams.get('lang') ? urlLang : savedLang

    setLanguage(nextLang)
    document.documentElement.lang = nextLang
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr'
    document.cookie = `navienty_lang=${nextLang}; path=/; max-age=31536000; SameSite=Lax`
  }, [searchParams])

  const buildLocalizedHref = (
    path: string,
    updates: Record<string, string | undefined> = {}
  ) => {
    const params = new URLSearchParams()

    params.set('lang', updates.lang ?? language)
    params.set('currency', updates.currency ?? defaultCurrency)

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'lang' || key === 'currency') return
      if (value) params.set(key, value)
    })

    return `${path}?${params.toString()}`
  }

  const propertiesHref = buildLocalizedHref('/properties')
  const communityHref = buildLocalizedHref('/community')
  const accountHref = buildLocalizedHref('/account')
  const loginHref = buildLocalizedHref('/login')

  const socialMenuLinks = [
    { label: t.facebook, href: 'https://www.facebook.com/' },
    { label: t.instagram, href: 'https://www.instagram.com/' },
    { label: t.linkedIn, href: 'https://www.linkedin.com/' },
  ]

  const footerQuickLinks = [
    { label: t.aboutUs, href: buildLocalizedHref('/about') },
    { label: t.board, href: buildLocalizedHref('/board') },
    { label: t.contact, href: buildLocalizedHref('/contact') },
  ]

  const primaryMenuLinks = [
    {
      label: !loading && profile ? t.account : t.login,
      href: !loading && profile ? accountHref : loginHref,
    },
    { label: t.community, href: communityHref },
  ]

  const menuFooterLinks: MenuFooterLink[] = [
    ...footerQuickLinks,
    {
      label: 'info@navienty.com',
      href: 'mailto:info@navienty.com',
      isEmail: true,
    },
  ]

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace(loginHref)
          return
        }

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, full_name, phone, wallet_cached_balance')
          .eq('id', user.id)
          .single()

        setProfile({
          id: user.id,
          full_name: profileData?.full_name ?? null,
          phone: profileData?.phone ?? null,
          wallet_cached_balance: profileData?.wallet_cached_balance ?? 0,
          email: user.email,
        })
      } catch {
        router.replace(loginHref)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase, loginHref])

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

  function handleLanguageChange(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage)

    window.localStorage.setItem('navienty_lang', nextLanguage)
    document.cookie = `navienty_lang=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = nextLanguage
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr'

    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', nextLanguage)
    params.set('currency', params.get('currency') || defaultCurrency)

    router.replace(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  async function handleLogout() {
    try {
      setLogoutLoading(true)
      await signOutUser()
      router.push(loginHref)
      router.refresh()
    } finally {
      setLogoutLoading(false)
    }
  }

  const firstName = useMemo(() => {
    const name = profile?.full_name?.trim()
    if (!name) return t.guest
    return name.split(' ')[0]
  }, [profile?.full_name, t.guest])

  const walletBalance = Number(profile?.wallet_cached_balance ?? 0).toFixed(2)

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

        .language-pill {
          border: 1px solid rgba(5, 74, 255, 0.16);
          background: #f7f9ff;
          color: #111827;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 800;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .language-pill:hover {
          transform: translateY(-1px);
          border-color: rgba(5, 74, 255, 0.28);
          background: #eef3ff;
        }

        .language-pill.is-active {
          background: #054aff;
          color: #ffffff;
          border-color: #054aff;
        }

        [dir='rtl'] .wallet-card-number-wrapper {
          text-align: left;
        }


        @media (prefers-color-scheme: dark) {
          :root {
            --menu-blue: #054aff;
            --menu-cream: #f8fafc;
            --menu-cream-soft: rgba(248, 250, 252, 0.92);
          }

          .menu-trigger-lines span {
            background: #f8fafc !important;
          }

          .mega-menu-overlay {
            background: #054aff;
            color: #f8fafc;
          }

          .mega-menu-small-link,
          .mega-menu-main-link,
          .mega-menu-close {
            color: #f8fafc;
          }

          .mega-menu-footer-link {
            color: rgba(248, 250, 252, 0.86);
          }

          .mega-menu-footer-link:hover {
            color: #ffffff;
          }

          .footer-esaf {
            background: #054aff;
          }

          .mobile-bottom-nav {
            background: rgba(11, 18, 32, 0.96);
            border-top-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.28);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
          }

          .mobile-bottom-nav__item--active {
            color: #60a5fa;
          }

          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) saturate(100%) invert(63%) sepia(98%)
              saturate(961%) hue-rotate(181deg) brightness(101%) contrast(96%);
          }

          .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 0.72;
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image,
          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 1;
          }

          .language-pill {
            border-color: rgba(96, 165, 250, 0.18);
            background: #0b1220;
            color: #e2e8f0;
          }

          .language-pill:hover {
            border-color: rgba(96, 165, 250, 0.34);
            background: #111827;
          }

          .language-pill.is-active {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
          }

          .wallet-back {
            background: #182b1a;
            box-shadow:
              inset 0 25px 35px rgba(0, 0, 0, 0.5),
              inset 0 5px 15px rgba(0, 0, 0, 0.55);
          }

          .pocket {
            filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.45));
          }

          .balance-stars {
            color: #9ab892;
          }

          .balance-real {
            color: #bbf7d0;
          }

          .wallet-balance-label {
            color: #9ab892;
          }

          .wallet-hover-hint {
            color: #bbf7d0;
          }

          .eye-icon {
            stroke: #86efac;
          }
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

          [dir='rtl'] .mega-menu-footer-links {
            align-items: flex-end;
            text-align: right;
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

      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] dark:bg-[#050816] dark:text-slate-100 md:pb-0"
      >
        <header className="sticky top-0 z-[110] bg-[#f5f7f9] dark:bg-[#0b1220] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
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
                aria-label={t.close}
                onClick={() => setMenuOpen(false)}
              >
                <span className="mega-menu-close-line" />
                <span>{t.close}</span>
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

        <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222222] dark:bg-[#050816] dark:text-slate-100 sm:px-6 lg:px-8">
          {loading ? (
            <div className="mx-auto max-w-6xl animate-pulse">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_46px_rgba(0,0,0,0.32)] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-[24px] bg-gray-200 dark:bg-slate-800" />
                    <div className="space-y-3">
                      <div className="h-7 w-40 rounded-xl bg-gray-200 dark:bg-slate-800" />
                      <div className="h-4 w-64 rounded-xl bg-gray-100 dark:bg-slate-800/70" />
                    </div>
                  </div>
                  <div className="h-24 w-full rounded-[24px] bg-gray-100 dark:bg-slate-800/70 lg:w-[320px]" />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-[28px] border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-[#111827]"
                    >
                      <div className="h-12 w-12 rounded-[18px] bg-gray-100 dark:bg-slate-800" />
                      <div className="mt-4 h-5 w-36 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="mt-3 h-4 w-full rounded bg-gray-100 dark:bg-slate-800/70" />
                      <div className="mt-2 h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800/70" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_18px_46px_rgba(0,0,0,0.32)] sm:p-6 lg:p-8">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <section className="relative overflow-hidden rounded-[30px] border border-[#dbe5ff] bg-gradient-to-l from-[#08152f] via-[#0b1f46] to-[#123a8f] p-5 text-white shadow-[0_16px_40px_rgba(8,21,47,0.18)] sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#6ea8ff]/20 blur-2xl" />
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.08]" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-col gap-6">
                        <div className="flex w-full items-start justify-between gap-4">
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {logoutLoading ? (
                              <>
                                <svg
                                  className="h-4 w-4 animate-spin"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
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
                                <span>{t.loggingOut}</span>
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
                                <span>{t.logOut}</span>
                              </>
                            )}
                          </button>

                          <h1 className="mt-1 min-w-0 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                            {t.welcome} {firstName}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="account-wallet-section rounded-[28px] bg-[#f3f6ff] p-4 shadow-[0_12px_30px_rgba(5,74,255,0.12)] dark:bg-[#111827] dark:shadow-[0_14px_34px_rgba(0,0,0,0.32)] sm:p-5">
                    <button
                      type="button"
                      onClick={() => setShowWalletBalance((prev) => !prev)}
                      className="wallet-button-wrapper block w-full rounded-[24px] text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#054aff]"
                      aria-label={t.walletAriaLabel}
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
                                <span className="label">{t.holder}</span>
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
                                <span className="label">{t.status}</span>
                                <span className="value">{t.activeAccount}</span>
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
                                <span className="label">{t.email}</span>
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

                            <div className="wallet-balance-label">{t.totalBalance}</div>

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
                              {showWalletBalance ? t.tapToHideBalance : t.tapToViewBalance}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </section>
                </div>

                <section className="mt-8">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Link
                      href={buildLocalizedHref('/account/wallet')}
                      className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.34)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff] dark:bg-[#0b1220]">
                          <img
                            src="https://i.ibb.co/zT33t0Rq/wallet-2527543.png"
                            alt="Add Balance icon"
                            className="account-menu-icon"
                          />
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-slate-100">
                        {t.addBalance}
                      </h3>
                    </Link>

                    <Link
                      href={buildLocalizedHref('/account/reservations')}
                      className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.34)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff] dark:bg-[#0b1220]">
                          <img
                            src="https://i.ibb.co/BHkWcRkv/calendar.png"
                            alt="Reservations icon"
                            className="account-menu-icon"
                          />
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-slate-100">
                        {t.reservations}
                      </h3>
                    </Link>

                    <div className="group rounded-[28px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111827] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.34)] lg:col-span-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffffff] dark:bg-[#0b1220]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.9}
                            stroke="currentColor"
                            className="account-menu-icon text-[#054aff] dark:text-[#60a5fa]"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.25h12M9 3v2.25m1.048 9.223A18.022 18.022 0 0 1 6.412 9m6.088 0h3m-10.5 0H3m3.412 0A18.022 18.022 0 0 0 12 16.5"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {t.language}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
                            {t.currentLanguage}:{' '}
                            {language === 'ar' ? t.arabic : t.english}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLanguageChange('en')}
                            className={`language-pill ${
                              language === 'en' ? 'is-active' : ''
                            }`}
                          >
                            {t.english}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLanguageChange('ar')}
                            className={`language-pill ${
                              language === 'ar' ? 'is-active' : ''
                            }`}
                          >
                            {t.arabic}
                          </button>
                        </div>
                      </div>
                    </div>
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
                  {t.footerTitle}
                </h2>
              </div>

              <div>
                <h3 className="footer-esaf-heading">{t.quickLinks}</h3>
                <div className="footer-esaf-links">
                  {footerQuickLinks.map((item) => (
                    <Link key={item.label} href={item.href} className="footer-esaf-link">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="footer-esaf-heading">{t.contactUs}</h3>
                <a href="mailto:info@navienty.com" className="footer-esaf-email">
                  info@navienty.com
                </a>
              </div>
            </div>

            <div className="footer-esaf-bottom">
              <p className="footer-esaf-copyright">
                © {currentYear} Navienty | {t.copyright}
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
              <span className="mobile-bottom-nav__label">{t.search}</span>
            </Link>

            <Link href={communityHref} className="mobile-bottom-nav__item">
              <img
                src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
                alt="Community"
                className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
              />
              <span className="mobile-bottom-nav__label">{t.community}</span>
            </Link>

            <Link
              href={accountHref}
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
              <span className="mobile-bottom-nav__label">{t.account}</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222222] dark:bg-[#050816] dark:text-slate-100">
          Loading...
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  )
}