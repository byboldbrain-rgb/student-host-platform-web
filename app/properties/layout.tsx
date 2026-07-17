import type { Metadata } from 'next'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from '@/src/lib/site'

const PAGE_URL = `${SITE_URL}/properties`

const PAGE_TITLE =
  'سكن طلاب في مصر | شقق وغرف قريبة من الجامعة'

const PAGE_DESCRIPTION =
  'ابحث عن سكن طلاب وسكن طالبات في مصر، وقارن الشقق والغرف حسب المدينة والمنطقة والسعر والصور والتوافر، وتواصل لحجز السكن عبر Navienty بدون عمولة على الطالب.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,

  keywords: [
    'سكن طلاب',
    'سكن طالبات',
    'سكن طلاب في مصر',
    'شقق طلاب',
    'غرف طلاب',
    'سكن قريب من الجامعة',
    'سكن جامعي خاص',
    'سكن طلاب بدون عمولة',
    'student housing Egypt',
    'student accommodation Egypt',
  ],

  alternates: {
    canonical: PAGE_URL,
  },

  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'سكن الطلاب على Navienty',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
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

export default function PropertiesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}