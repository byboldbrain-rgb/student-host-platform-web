import './globals.css'
import type { Metadata, Viewport } from 'next'
import SplashScreen from '@/components/SplashScreen'

const SITE_URL = 'https://www.navienty.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Navienty | منصة سكن الطلاب',
    template: '%s | Navienty',
  },
  description:
    'Navienty منصة تساعد الطلاب على اكتشاف ومقارنة أماكن السكن الطلابي والتواصل مع المضيفين بسهولة، بدون أي عمولة على الطالب.',
  applicationName: 'Navienty',
  manifest: '/manifest.webmanifest',
  keywords: [
    'سكن طلاب',
    'سكن طلاب في أسيوط',
    'سكن طالبات',
    'سكن طالبات في أسيوط',
    'سكن قريب من جامعة أسيوط',
    'غرف طلاب',
    'غرف طلاب في أسيوط',
    'سكن جامعي خاص',
    'سكن طلاب بدون عمولة',
    'Navienty',
  ],
  authors: [{ name: 'Navienty' }],
  creator: 'Navienty',
  publisher: 'Navienty',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Navienty | منصة سكن الطلاب',
    description:
      'اكتشف وقارن أماكن السكن الطلابي وتواصل مع المضيفين بسهولة، بدون أي عمولة على الطالب.',
    url: SITE_URL,
    siteName: 'Navienty',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Navienty',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navienty | منصة سكن الطلاب',
    description:
      'منصة تساعد الطلاب على اكتشاف ومقارنة أماكن السكن الطلابي بدون أي عمولة على الطالب.',
    images: ['/icon.png'],
  },
  icons: {
    icon: '/icon.png',
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