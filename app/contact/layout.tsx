import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description:
    'تواصل مع فريق Navienty للحصول على المساعدة في السكن الطلابي أو إضافة عقارك أو الاستفسار عن خدمات المنصة.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'تواصل معنا | Navienty',
    description:
      'تواصل مع فريق Navienty للحصول على المساعدة في السكن الطلابي أو إضافة عقارك.',
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تواصل معنا | Navienty',
    description:
      'تواصل مع فريق Navienty للحصول على المساعدة في السكن الطلابي أو إضافة عقارك.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function ContactLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
