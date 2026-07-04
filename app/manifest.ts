import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Navienty WhatsApp',
    short_name: 'WhatsApp',
    description: 'Navienty WhatsApp Admin Inbox',
    start_url: '/admin/whatsapp',
    scope: '/admin',
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
