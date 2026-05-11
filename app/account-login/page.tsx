import Link from 'next/link'
import { Languages } from 'lucide-react'

type SearchParams = {
  lang?: string
  currency?: string
}

type SupportedLanguage = 'en' | 'ar'

const TRANSLATIONS = {
  en: {
    loginButton: 'Log in or sign up',
    languageValue: 'العربية',
    languageText: 'Change language',
    search: 'Search',
    community: 'Community',
    account: 'Login',
  },
  ar: {
    loginButton: 'تسجيل الدخول أو التسجيل',
    languageValue: 'English',
    languageText: 'تغيير اللغة',
    search: 'استكشاف',
    community: 'المجتمع',
    account: 'تسجيل الدخول',
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function normalizeCurrency(value?: string) {
  return value?.trim().toUpperCase() || 'EGP'
}

function buildUrl(path: string, language: SupportedLanguage, currency: string) {
  const params = new URLSearchParams()

  params.set('lang', language)
  params.set('currency', currency)

  return `${path}?${params.toString()}`
}

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { lang, currency } = await searchParams

  const selectedLanguage = normalizeLanguage(lang)
  const selectedCurrency = normalizeCurrency(currency)
  const isArabic = selectedLanguage === 'ar'
  const t = TRANSLATIONS[selectedLanguage]

  const loginHref = buildUrl('/login', selectedLanguage, selectedCurrency)
  const propertiesHref = buildUrl('/properties', selectedLanguage, selectedCurrency)
  const communityHref = buildUrl('/community', selectedLanguage, selectedCurrency)
  const accountHref = buildUrl('/account-login', selectedLanguage, selectedCurrency)

  const languageHref = buildUrl(
    '/account-login',
    selectedLanguage === 'ar' ? 'en' : 'ar',
    selectedCurrency
  )

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#f7f7f7] pb-24 text-[#222222] dark:bg-[#050816] dark:text-slate-100"
    >
      <style>{`
        .account-login-shell {
          width: 100%;
          max-width: 520px;
          min-height: calc(100dvh - 96px);
          margin: 0 auto;
          background: #f7f7f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 0;
        }

        .account-login-center {
          width: 100%;
          transform: translateY(-18px);
        }

        .account-login-logo-area {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 34px;
        }

        .account-login-logo-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .account-login-logo {
          width: 118px;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .account-login-actions {
          width: 100%;
        }

        .account-login-card {
          margin: 0 10px;
          border: 1px solid #dddddd;
          background: #ffffff;
          padding: 10px;
        }

        .account-login-button {
          display: flex;
          width: 100%;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          background: #054aff;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: -0.01em;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
        }

        .account-login-button:hover {
          background: #003fe0;
        }

        .account-login-button:active {
          transform: scale(0.99);
        }

        .account-login-language-section {
          margin: 14px 10px 0;
          background: #ffffff;
          border-top: 1px solid #e6e6e6;
          border-bottom: 1px solid #e6e6e6;
        }

        .account-login-language-row {
          direction: ltr;
          display: flex;
          min-height: 60px;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 9px 0;
          color: #111111;
          text-decoration: none;
          background: #ffffff;
          transition: background 0.16s ease;
        }

        .account-login-language-row:hover {
          background: #fafafa;
        }

        .account-login-language-copy {
          min-width: 0;
          text-align: right;
        }

        .account-login-language-value {
          margin: 0;
          color: #111111;
          font-size: 14px;
          line-height: 1.25;
          font-weight: 500;
          letter-spacing: -0.01em;
        }

        .account-login-language-text {
          margin: 3px 0 0;
          color: #111111;
          font-size: 11px;
          line-height: 1.25;
          font-weight: 500;
        }

        .account-login-language-icon {
          width: 20px;
          height: 20px;
          color: #111111;
          flex-shrink: 0;
          stroke-width: 1.8;
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: block;
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
          max-width: 520px;
          margin: 0 auto;
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

        @media (prefers-color-scheme: dark) {
          .account-login-shell {
            background: #050816;
          }

          .account-login-card {
            background: #0b1220;
            border-color: rgba(255, 255, 255, 0.1);
          }

          .account-login-button {
            background: #2563eb;
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
          }

          .account-login-button:hover {
            background: #1d4ed8;
          }

          .account-login-language-section {
            background: #0b1220;
            border-top-color: rgba(255, 255, 255, 0.1);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .account-login-language-row {
            background: #0b1220;
            color: #f8fafc;
          }

          .account-login-language-row:hover {
            background: #111827;
          }

          .account-login-language-value,
          .account-login-language-text,
          .account-login-language-icon {
            color: #f8fafc;
          }

          .account-login-language-text {
            color: #94a3b8;
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
            filter: grayscale(1) brightness(0.85);
          }
        }

        @media (max-width: 420px) {
          .account-login-shell {
            padding-left: 0;
            padding-right: 0;
          }

          .account-login-logo {
            width: 112px;
          }

          .account-login-center {
            transform: translateY(-22px);
          }
        }

        @media (min-width: 768px) {
          .account-login-shell {
            min-height: calc(100dvh - 96px);
          }

          .account-login-card {
            border-radius: 8px;
          }
        }
      `}</style>

      <div className="account-login-shell">
        <div className="account-login-center">
          <section className="account-login-logo-area">
            <Link
              href={propertiesHref}
              className="account-login-logo-link"
              aria-label="Navienty home"
            >
              <img
                src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
                alt="Navienty"
                className="account-login-logo"
              />
            </Link>
          </section>

          <div className="account-login-actions">
            <section className="account-login-card">
              <Link href={loginHref} className="account-login-button">
                {t.loginButton}
              </Link>
            </section>

            <section className="account-login-language-section">
              <Link href={languageHref} className="account-login-language-row">
                <div className="account-login-language-copy">
                  <p className="account-login-language-value">{t.languageValue}</p>
                  <p className="account-login-language-text">{t.languageText}</p>
                </div>

                <Languages className="account-login-language-icon" />
              </Link>
            </section>
          </div>
        </div>
      </div>

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
    </main>
  )
}
