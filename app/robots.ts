import type { MetadataRoute } from 'next'

const SITE_URL = 'https://navienty.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/board',
          '/contact',
          '/community',
          '/properties',
          '/sakan/',
        ],
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}