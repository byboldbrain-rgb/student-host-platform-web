import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Navienty',
    short_name: 'Navienty',
    description: 'Student accommodation listing platform',
    start_url: '/admin/finance/deposit-requests',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#054aff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}