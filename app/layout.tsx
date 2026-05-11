import './globals.css'
import type { Metadata, Viewport } from 'next'
import SplashScreen from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: 'Navienty',
  description: 'Student accommodation listing platform',
  manifest: '/manifest.webmanifest',
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}