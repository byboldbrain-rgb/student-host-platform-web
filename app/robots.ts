import type { MetadataRoute } from 'next'

const SITE_URL = 'https://navienty.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/account',
          '/account/',
          '/account/*',
          '/login',
          '/signup',
          '/api',
          '/api/',
          '/api/*',
          '/properties?*',
          '/sakan/*?*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}