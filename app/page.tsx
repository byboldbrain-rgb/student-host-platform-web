import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'

const SITE_URL = 'https://navienty.com'
const DEFAULT_OG_IMAGE = '/og-image.jpg'

export const metadata: Metadata = {
  title: 'سكن طلاب قريب من جامعتك بدون عمولة',
  description:
    'Navienty يساعدك على اكتشاف سكن طلاب وسكن طالبات قريب من الجامعة، مقارنة الأسعار والصور والموقع، والتواصل مباشرة مع المضيف بدون عمولة على الطالب.',
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    description:
      'اكتشف سكن طلاب مناسب، قارن الأسعار والصور والموقع، وتواصل مباشرة مع المضيف بدون أي عمولة على الطالب.',
    url: SITE_URL,
    siteName: 'Navienty',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Navienty student housing platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
    description:
      'قارن أماكن السكن الطلابي حسب الجامعة والمدينة والمنطقة وتواصل مع المضيف مباشرة.',
    images: [DEFAULT_OG_IMAGE],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Navienty',
  alternateName: 'نافينتي',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description:
    'منصة تساعد الطلاب على اكتشاف ومقارنة أماكن السكن الطلابي والتواصل مع المضيفين مباشرة بدون عمولة على الطالب.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@navienty.com',
    contactType: 'customer support',
    areaServed: 'EG',
    availableLanguage: ['Arabic', 'English'],
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Navienty',
  alternateName: 'نافينتي',
  url: SITE_URL,
  inLanguage: ['ar-EG', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/properties?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

const marketplaceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Navienty - سكن طلاب قريب من جامعتك بدون عمولة',
  url: SITE_URL,
  description:
    'اكتشف سكن طلاب وسكن طالبات قريب من الجامعة، قارن الأسعار والموقع والصور، وتواصل مباشرة مع المضيف بدون عمولة على الطالب.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Navienty',
    url: SITE_URL,
  },
  about: [
    { '@type': 'Thing', name: 'سكن طلاب' },
    { '@type': 'Thing', name: 'سكن طالبات' },
    { '@type': 'Thing', name: 'Student housing' },
  ],
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-[#050816] dark:text-white">
      <Script
        id="navienty-organization-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Script
        id="navienty-website-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Script
        id="navienty-homepage-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketplaceJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
          بدون عمولة على الطالب
        </p>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          سكن طلاب قريب من جامعتك، بأسعار واضحة وتواصل مباشر مع المضيف
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Navienty يساعدك على اكتشاف ومقارنة أماكن السكن الطلابي حسب المدينة والجامعة والمنطقة، مع صور وأسعار وتفاصيل واضحة قبل التواصل.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/properties?lang=ar&currency=EGP"
            className="rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            ابدأ البحث عن سكن
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-slate-200 px-7 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
          >
            اعرف أكثر عن Navienty
          </Link>
        </div>
      </section>
    </main>
  )
}
