import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Contact Navienty for student housing support, partnership requests, or help finding accommodation near your university.',
  alternates: {
    canonical: 'https://navienty.com/contact',
  },
  openGraph: {
    title: 'Contact us | Navienty',
    description:
      'Contact Navienty for student housing support, partnership requests, or help finding accommodation near your university.',
    url: 'https://navienty.com/contact',
    siteName: 'Navienty',
    type: 'website',
    locale: 'ar_EG',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Navienty',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact us | Navienty',
    description:
      'Contact Navienty for student housing support, partnership requests, or help finding accommodation near your university.',
    images: ['/og-image.jpg'],
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}