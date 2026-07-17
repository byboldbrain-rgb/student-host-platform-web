import type { ReactNode } from 'react'
import { PRIVATE_PAGE_METADATA } from '@/src/lib/private-page-metadata'

export const metadata = PRIVATE_PAGE_METADATA

export default function PrivatePageLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}