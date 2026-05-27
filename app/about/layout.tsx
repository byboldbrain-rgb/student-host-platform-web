import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Learn more about Navienty, Egypt’s student housing platform helping students discover trusted accommodation near universities without commission.',
  alternates: {
    canonical: 'https://navienty.com/about',
  },
  openGraph: {
    title: 'About us | Navienty',
    description:
      'Learn more about Navienty, Egypt’s student housing platform helping students discover trusted accommodation near universities without commission.',
    url: 'https://navienty.com/about',
    siteName: 'Navienty',
    type: 'website',
    locale: 'ar_EG',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About Navienty',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About us | Navienty',
    description:
      'Learn more about Navienty, Egypt’s student housing platform helping students discover trusted accommodation near universities without commission.',
    images: ['/og-image.jpg'],
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}