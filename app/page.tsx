import { permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'

const SITE_URL = 'https://navienty.com'
const PROPERTIES_URL = `${SITE_URL}/properties`

export const metadata: Metadata = {
  title: 'Navienty | سكن طلاب قريب من جامعتك',
  description:
    'اكتشف سكن طلاب وسكن طالبات قريب من الجامعة، قارن الأسعار والصور والموقع، وتواصل مباشرة مع المضيف بدون عمولة على الطالب.',
  alternates: {
    canonical: PROPERTIES_URL,
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
  openGraph: {
    title: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    description:
      'اكتشف سكن طلاب مناسب، قارن الأسعار والصور والموقع، وتواصل مباشرة مع المضيف بدون أي عمولة على الطالب.',
    url: PROPERTIES_URL,
    siteName: 'Navienty',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
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
      'قارن أماكن السكن الطلابي حسب الجامعة والمدينة والمنطقة وتواصل مع المضيف مباشرة.',
    images: ['/og-image.jpg'],
  },
}

export default function HomePage() {
  permanentRedirect('/properties?lang=ar&currency=EGP')
}