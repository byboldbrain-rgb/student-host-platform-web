import type { Metadata } from 'next'

import styles from './download.module.css'
import { HERO_IMAGE_DATA_URI } from './hero-image'

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.navienty.now'

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_NAVIENTY_NOW_APP_STORE_URL || '#'

export const metadata: Metadata = {
  title: {
    absolute: 'Navienty Now | حمّل التطبيق',
  },
  description:
    'حمّل تطبيق Navienty Now واطلب احتياجاتك بسهولة من موبايلك.',
  robots: {
    index: true,
    follow: true,
  },
}

function BrandLogo() {
  return (
    <div className={styles.brand} aria-label="Navienty Now">
      <div className={styles.brandWordmark}>
        <span className={styles.brandText}>Navienty</span>
        <svg
          className={styles.brandLeaf}
          viewBox="0 0 36 36"
          aria-hidden="true"
        >
          <path
            d="M29.9 4.1C19.2 4.3 10.7 8.4 8 17.2c-2 6.4 1.2 11.5 7.2 12.7 5.9 1.2 11.2-2 13.9-8.4 2.1-5 2.3-10.8.8-17.4Z"
            fill="currentColor"
          />
          <path
            d="M9.9 27.7c3-7.8 8.2-13 15.8-17.3"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      <div className={styles.brandNow}>
        <span className={styles.brandLine} />
        <strong>Now</strong>
        <span className={styles.brandLine} />
      </div>
    </div>
  )
}

function AppleLogo() {
  return (
    <svg
      className={styles.appleIcon}
      viewBox="0 0 40 48"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M33.6 25.3c0-5.9 4.8-8.8 5-8.9-2.7-4-7-4.5-8.5-4.6-3.6-.4-7 2.1-8.8 2.1-1.8 0-4.6-2-7.5-1.9-3.9.1-7.4 2.2-9.4 5.6-4 6.9-1 17.1 2.9 22.7 1.9 2.7 4.1 5.8 7 5.7 2.8-.1 3.9-1.8 7.3-1.8 3.4 0 4.4 1.8 7.4 1.7 3.1 0 5-2.7 6.9-5.5 2.2-3.2 3.1-6.2 3.2-6.4-.1 0-5.5-2.1-5.5-8.7ZM27.7 8c1.6-2 2.7-4.7 2.4-7.4-2.3.1-5.1 1.5-6.8 3.4-1.5 1.7-2.8 4.5-2.5 7.1 2.6.2 5.2-1.3 6.9-3.1Z"
      />
    </svg>
  )
}

function GooglePlayLogo() {
  return (
    <svg
      className={styles.playIcon}
      viewBox="0 0 52 58"
      aria-hidden="true"
    >
      <path fill="#00D6FF" d="M3.5 3.8 31.8 29 3.6 54.3A7 7 0 0 1 2 49.8V8.2c0-1.7.5-3.2 1.5-4.4Z" />
      <path fill="#00F076" d="m6.8 1.6 33.9 19.2-8.9 8.2L3.5 3.8c.9-1.1 2-1.8 3.3-2.2Z" />
      <path fill="#FFD000" d="m31.8 29 8.9 8.1L6.8 56.4a6.7 6.7 0 0 1-3.2-2.1L31.8 29Z" />
      <path fill="#FF4B55" d="M48.2 25c2.4 1.4 2.4 4.9 0 6.3l-7.5 5.8-8.9-8.1 8.9-8.2 7.5 4.2Z" />
    </svg>
  )
}

function AppStoreBadge() {
  const isAvailable = APP_STORE_URL !== '#'

  return (
    <a
      className={`${styles.storeBadge} ${!isAvailable ? styles.storeBadgePending : ''}`}
      href={APP_STORE_URL}
      aria-label={
        isAvailable
          ? 'Download Navienty Now on the App Store'
          : 'Navienty Now for iPhone - App Store link coming soon'
      }
      aria-disabled={!isAvailable}
      {...(isAvailable
        ? { target: '_blank', rel: 'noreferrer' }
        : { onClick: undefined })}
    >
      <AppleLogo />
      <span className={styles.badgeCopy} dir="ltr">
        <small>Download on the</small>
        <strong>App Store</strong>
      </span>
    </a>
  )
}

function GooglePlayBadge() {
  return (
    <a
      className={styles.storeBadge}
      href={GOOGLE_PLAY_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Get Navienty Now on Google Play"
    >
      <GooglePlayLogo />
      <span className={styles.badgeCopy} dir="ltr">
        <small>GET IT ON</small>
        <strong>Google Play</strong>
      </span>
    </a>
  )
}

export default function DownloadPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
      </header>

      <section className={styles.hero} aria-labelledby="download-heading">
        <div
          className={styles.heroPhoto}
          role="img"
          aria-label="هاتف يعرض تطبيق Navienty Now"
          style={{ backgroundImage: `url(${HERO_IMAGE_DATA_URI})` }}
        />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="download-heading">نزل الابلكيشن دلوقتي</h1>

            <div className={styles.accentLine} aria-hidden="true" />

            <div className={styles.storeButtons}>
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
