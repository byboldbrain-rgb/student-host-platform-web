import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'من نحن',
  description:
    'تعرف على Navienty ورؤيتنا لتسهيل العثور على سكن طلاب مناسب وقريب من الجامعات بدون عمولة على الطالب.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'من نحن | Navienty',
    description:
      'تعرف على Navienty ورؤيتنا لتسهيل العثور على سكن طلاب مناسب وقريب من الجامعات.',
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'من نحن | Navienty',
    description:
      'تعرف على Navienty ورؤيتنا لتسهيل العثور على سكن طلاب مناسب وقريب من الجامعات.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function AboutLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
