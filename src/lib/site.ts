export const SITE_URL = 'https://www.navienty.com'

export const SITE_NAME = 'Navienty'

export const DEFAULT_OG_IMAGE = '/og-image.jpg'

export const SITE_EMAIL = 'info@navienty.com'

export const SITE_PHONE = '+201114886078'

export const SITE_SOCIAL_PROFILES = [
  process.env.NEXT_PUBLIC_FACEBOOK_URL,
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_LINKEDIN_URL,
].filter((url): url is string => Boolean(url?.trim()))