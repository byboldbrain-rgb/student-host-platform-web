import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'دليل السكن الطلابي',
  description:
    'استكشف دليل Navienty للنصائح والمعلومات التي تساعد الطلاب على اختيار السكن المناسب والاستعداد للحياة الجامعية.',
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
  openGraph: {
    title: 'دليل السكن الطلابي | Navienty',
    description:
      'نصائح ومعلومات تساعد الطلاب على اختيار السكن المناسب والاستعداد للحياة الجامعية.',
    url: `${SITE_URL}/community`,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل السكن الطلابي | Navienty',
    description:
      'نصائح ومعلومات تساعد الطلاب على اختيار السكن المناسب والاستعداد للحياة الجامعية.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function CommunityLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
