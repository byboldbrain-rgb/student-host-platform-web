import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Explore Navienty community updates, student housing tips, and guides that help students choose better accommodation.',
  alternates: {
    canonical: 'https://navienty.com/community',
  },
  openGraph: {
    title: 'Community | Navienty',
    description:
      'Explore Navienty community updates, student housing tips, and guides that help students choose better accommodation.',
    url: 'https://navienty.com/community',
    siteName: 'Navienty',
    type: 'website',
    locale: 'ar_EG',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Navienty Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community | Navienty',
    description:
      'Explore Navienty community updates, student housing tips, and guides that help students choose better accommodation.',
    images: ['/og-image.jpg'],
  },
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}