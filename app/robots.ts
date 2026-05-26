import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.navienty.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/account',
          '/login',
          '/signup',
          '/api',
          '/properties?*',
          '/sakan/*?*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
