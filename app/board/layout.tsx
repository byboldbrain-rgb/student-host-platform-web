import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/src/lib/site'

export const metadata: Metadata = {
  title: 'الإدارة',
  description:
    'تعرف على فريق إدارة Navienty المسؤول عن تطوير تجربة السكن الطلابي وخدمات المنصة.',
  alternates: {
    canonical: `${SITE_URL}/board`,
  },
  openGraph: {
    title: 'الإدارة | Navienty',
    description:
      'تعرف على فريق إدارة Navienty المسؤول عن تطوير تجربة السكن الطلابي.',
    url: `${SITE_URL}/board`,
    siteName: SITE_NAME,
    locale: 'ar_EG',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'الإدارة | Navienty',
    description:
      'تعرف على فريق إدارة Navienty المسؤول عن تطوير تجربة السكن الطلابي.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function BoardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
