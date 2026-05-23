import './globals.css'
import type { Metadata, Viewport } from 'next'
import SplashScreen from '@/components/SplashScreen'

const SITE_URL = 'https://navienty.com'
const SITE_NAME = 'Navienty'
const DEFAULT_OG_IMAGE = '/og-image.jpg'

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
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
