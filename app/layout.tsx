import './globals.css'
import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
