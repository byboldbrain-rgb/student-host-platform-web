import './globals.css'
import SplashScreen from '@/components/SplashScreen'

export const metadata = {
  title: 'Navienty',
  description: 'Student accommodation listing platform',
  icons: {
    icon: '/icon.png',
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