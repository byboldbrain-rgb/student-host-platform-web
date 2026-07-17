import './globals.css'
import type { Metadata, Viewport } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import SplashScreen from '@/components/SplashScreen'
import AnalyticsInitializer from '@/components/AnalyticsInitializer'
import PushNotificationInitializer from './PushNotificationInitializer'
import 'mapbox-gl/dist/mapbox-gl.css'

const SITE_URL = 'https://navienty.com'
const SITE_NAME = 'Navienty'
const DEFAULT_OG_IMAGE = '/og-image.jpg'

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  sameAs: [
    'https://www.facebook.com/',
    'https://www.instagram.com/',
    'https://www.linkedin.com/',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@navienty.com',
      telephone: '+201018668663',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: ['Navienty Student Housing', 'نافينتي'],
  url: SITE_URL,
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
  inLanguage: ['ar-EG', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/properties?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

const siteNavigationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${SITE_URL}/#site-navigation`,
  name: 'Navienty main pages',
  itemListElement: [
    {
      '@type': 'SiteNavigationElement',
      position: 1,
      name: 'About us',
      url: `${SITE_URL}/about`,
    },
    {
      '@type': 'SiteNavigationElement',
      position: 2,
      name: 'Board',
      url: `${SITE_URL}/board`,
    },
    {
      '@type': 'SiteNavigationElement',
      position: 3,
      name: 'Contact us',
      url: `${SITE_URL}/contact`,
    },
    {
      '@type': 'SiteNavigationElement',
      position: 4,
      name: 'Student housing',
      url: `${SITE_URL}/properties`,
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    template: '%s | Navienty',
  },
  description:
    'اكتشف سكن طلاب قريب من جامعتك، قارن الأسعار والموقع والصور، وتواصل مباشرة مع المضيف بدون عمولة على الطالب.',
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  keywords: [
    'سكن طلاب',
    'سكن طالبات',
    'سكن جامعي خاص',
    'سكن قريب من الجامعة',
    'سكن قريب من جامعة أسيوط',
    'سكن طلاب في أسيوط',
    'سكن طالبات في أسيوط',
    'غرف طلاب',
    'غرف طالبات',
    'شقق طلاب',
    'سكن طلاب بدون عمولة',
    'student housing Egypt',
    'student accommodation Egypt',
    'Navienty',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Student housing marketplace',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    description:
      'قارن أماكن السكن الطلابي حسب الجامعة والمدينة والمنطقة، شاهد الصور والأسعار، وتواصل مع المضيف مباشرة بدون عمولة على الطالب.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Navienty student housing platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    description:
      'اكتشف سكن طلاب قريب من جامعتك، قارن الأسعار والصور، وتواصل مباشرة مع المضيف بدون عمولة.',
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      {
        url: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#ffffff',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#050816',
    },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
    >
      <body>
        <PushNotificationInitializer />

        <SplashScreen />

        <AnalyticsInitializer />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNavigationJsonLd),
          }}
        />

        {children}

        {process.env.NODE_ENV === 'production' &&
        GA_MEASUREMENT_ID ? (
          <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        ) : null}
      </body>
    </html>
  )
}