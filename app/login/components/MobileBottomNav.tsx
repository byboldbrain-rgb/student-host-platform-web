'use client'

import Link from 'next/link'

type MobileBottomNavProps = {
  active?: 'search' | 'community' | 'login' | 'account'
  accountHref?: string
  accountLabel?: string
}

export default function MobileBottomNav({
  active = 'login',
  accountHref = '/login',
  accountLabel = 'Log in',
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
      <div className="mobile-bottom-nav__inner">
        <Link
          href="/properties"
          className={`mobile-bottom-nav__item ${
            active === 'search' ? 'mobile-bottom-nav__item--active' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.9}
            stroke="currentColor"
            className="mobile-bottom-nav__icon"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 16l4 4"
            />
          </svg>
          <span className="mobile-bottom-nav__label">Search</span>
        </Link>

        <Link
          href="/community"
          className={`mobile-bottom-nav__item ${
            active === 'community' ? 'mobile-bottom-nav__item--active' : ''
          }`}
        >
          <img
            src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
            alt="Community"
            className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
          />
          <span className="mobile-bottom-nav__label">Community</span>
        </Link>

        <Link
          href={accountHref}
          className={`mobile-bottom-nav__item ${
            active === 'login' || active === 'account'
              ? 'mobile-bottom-nav__item--active'
              : ''
          }`}
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
          <span className="mobile-bottom-nav__label">{accountLabel}</span>
        </Link>
      </div>
    </nav>
  )
}