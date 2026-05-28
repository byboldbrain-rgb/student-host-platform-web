import Link from "next/link";
import Script from "next/script";
import { Squada_One } from "next/font/google";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import PostCard from "./components/feed/PostCard";
import type { FeedPost } from "./components/feed/types";
import CommunityNotifications from "./CommunityNotifications";
import CommunityFeedVideoAutoplay from "./CommunityFeedVideoAutoplay";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});


const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type SearchParams = {
  lang?: string;
  currency?: string;
};

type SupportedLanguage = "en" | "ar";

type PostAsset = {
  id: number;
  asset_type: "image" | "video";
  file_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

type CommunityPost = {
  id: number;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  post_type: "blog" | "announcement" | "news" | "update";
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  social_media_link: string | null;
  community_post_assets: PostAsset[];
};

const TRANSLATIONS = {
  en: {
    joinUs: "Join Us",
    failedToLoadPosts: "Failed to load community posts.",
    noPosts: "No posts published yet.",
    footerTitle: "Find your way to better student living",
    quickLinks: "Quick Links",
    aboutUs: "About us",
    board: "Board",
    contact: "Contact",
    contactUs: "Contact Us",
    footerEmail: "info@navienty.com",
    search: "Search",
    community: "Guide",
    account: "Account",
    login: "Login",
    language: "Language",
    english: "English",
    arabic: "العربية",
    navientyTeam: "Navienty Team",
    copyright: (year: number) => `© ${year} Navienty | All rights reserved.`,
  },
  ar: {
    joinUs: "انضم إلينا",
    failedToLoadPosts: "تعذر تحميل منشورات المجتمع.",
    noPosts: "لا توجد منشورات منشورة حتى الآن.",
    footerTitle: "اعثر على طريقك لحياة طلابية أفضل",
    quickLinks: "روابط سريعة",
    aboutUs: "من نحن",
    board: "الإدارة",
    contact: "تواصل معنا",
    contactUs: "تواصل معنا",
    footerEmail: "info@navienty.com",
    search: "استكشاف",
    community: "الدليل",
    account: "الحساب",
    login: "تسجيل الدخول",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    navientyTeam: "فريق نافينتي",
    copyright: (year: number) => `© ${year} نافينتي | جميع الحقوق محفوظة.`,
  },
} as const;

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeCurrency(value?: string) {
  return value?.trim().toUpperCase() || "EGP";
}

function buildUrl(path: string, language: SupportedLanguage, currency: string) {
  const params = new URLSearchParams();
  params.set("lang", language);
  params.set("currency", currency);

  return `${path}?${params.toString()}`;
}

function getOppositeLanguage(language: SupportedLanguage): SupportedLanguage {
  return language === "ar" ? "en" : "ar";
}

function normalizePosts(
  posts: CommunityPost[],
  language: SupportedLanguage,
  t: (typeof TRANSLATIONS)["en"] | (typeof TRANSLATIONS)["ar"],
): FeedPost[] {
  const isArabic = language === "ar";

  return posts.map((post) => {
    const title = isArabic
      ? post.title_ar || post.title_en
      : post.title_en || post.title_ar || "";

    const excerpt = isArabic
      ? post.excerpt_ar || post.excerpt_en
      : post.excerpt_en || post.excerpt_ar;

    const content = isArabic
      ? post.content_ar || post.content_en
      : post.content_en || post.content_ar;

    const activeAssets = (post.community_post_assets || [])
      .filter((asset) => asset.is_active && asset.file_url)
      .sort((a, b) => a.sort_order - b.sort_order);

    const media: FeedPost["media"] = activeAssets.map((asset) => ({
      id: asset.id,
      type: asset.asset_type,
      src: asset.file_url,
      poster: asset.thumbnail_url || null,
      alt: asset.alt_text || title,
      width: null,
      height: null,
      durationMs: null,
      blurDataUrl: null,
    }));

    if (media.length === 0 && post.cover_image_url) {
      media.push({
        id: `cover-${post.id}`,
        type: "image",
        src: post.cover_image_url,
        poster: null,
        alt: title,
        width: null,
        height: null,
        durationMs: null,
        blurDataUrl: null,
      });
    }

    return {
      id: post.id,
      author: {
        id: `author-${post.id}`,
        name: post.author_name || t.navientyTeam,
        handle: "navienty",
        avatarUrl: "https://i.ibb.co/FLsWDBr6/Untitled.png",
        verified: true,
      },
      createdAt: post.published_at || post.created_at,
      caption: excerpt || content || title,
      media,
      shareUrl: post.social_media_link,
      metrics: {
        likes: 120 + post.id,
        comments: 8 + (post.id % 17),
        shares: 3 + (post.id % 9),
        views: media.some((item) => item.type === "video")
          ? 1000 + post.id * 9
          : undefined,
        saves: 0,
      },
      viewerState: {
        liked: false,
        saved: false,
        followingAuthor: false,
      },
    };
  });
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const currentYear = new Date().getFullYear();
  const { lang, currency } = await searchParams;

  const selectedLanguage = normalizeLanguage(lang);
  const selectedCurrency = normalizeCurrency(currency);
  const isArabic = selectedLanguage === "ar";
  const t = TRANSLATIONS[selectedLanguage];

  const { data, error } = await supabase
    .from("community_posts")
    .select(
      `
      id,
      title_en,
      title_ar,
      excerpt_en,
      excerpt_ar,
      content_en,
      content_ar,
      cover_image_url,
      author_name,
      post_type,
      is_featured,
      is_published,
      published_at,
      created_at,
      social_media_link,
      community_post_assets (
        id,
        asset_type,
        file_url,
        thumbnail_url,
        alt_text,
        sort_order,
        is_cover,
        is_active
      )
    `,
    )
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const posts: CommunityPost[] = (data as CommunityPost[] | null) ?? [];
  const feedPosts = normalizePosts(posts, selectedLanguage, t);

  const homeHref = buildUrl("/properties", selectedLanguage, selectedCurrency);
  const propertiesHref = buildUrl(
    "/properties",
    selectedLanguage,
    selectedCurrency,
  );
  const communityHref = buildUrl(
    "/community",
    selectedLanguage,
    selectedCurrency,
  );
  const nextMobileLanguage = getOppositeLanguage(selectedLanguage);
  const mobileLanguageHref = buildUrl(
    "/community",
    nextMobileLanguage,
    selectedCurrency,
  );
  const mobileLanguageLabel = selectedLanguage === "ar" ? t.english : t.arabic;
  const mobileLanguageAriaLabel =
    selectedLanguage === "ar"
      ? "Switch language to English"
      : "تغيير اللغة إلى العربية";

  const footerQuickLinks = [
    {
      label: t.aboutUs,
      href: buildUrl("/about", selectedLanguage, selectedCurrency),
    },
    {
      label: t.board,
      href: buildUrl("/board", selectedLanguage, selectedCurrency),
    },
    {
      label: t.contact,
      href: buildUrl("/contact", selectedLanguage, selectedCurrency),
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-screen bg-[#f7f7f8] pb-32 text-[#20212a] dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <Script
        id="community-auto-device-language-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              try {
                var params = new URLSearchParams(window.location.search);
                var currentLang = params.get('lang');
                var currentCurrency = params.get('currency');

                function getBrowserLanguage() {
                  var storedLanguage = localStorage.getItem('navienty-language');
                  if (storedLanguage === 'ar' || storedLanguage === 'en') {
                    return storedLanguage;
                  }

                  var browserLanguage = (navigator.language || navigator.userLanguage || '').toLowerCase();
                  return browserLanguage.indexOf('ar') === 0 ? 'ar' : 'en';
                }

                if (!currentLang) {
                  params.set('lang', getBrowserLanguage());

                  if (!currentCurrency) {
                    params.set('currency', 'EGP');
                  }

                  var nextUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
                  window.location.replace(nextUrl);
                  return;
                }

                if (currentLang === 'ar' || currentLang === 'en') {
                  localStorage.setItem('navienty-language', currentLang);
                }
              } catch (error) {
                // Keep page usable if storage is blocked.
              }
            })();
          `,
        }}
      />


      <CommunityNotifications />
      <CommunityFeedVideoAutoplay />

      <style>{`

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-decoration: none;
          transform: translateY(-7px);
        }

        .navienty-logo--centered {
          margin-left: auto;
          margin-right: auto;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        [dir='rtl'] .navienty-logo-text-wrap {
          transform: translateX(6px);
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }

        [dir='rtl'] .header-actions {
          margin-left: 0;
          margin-right: auto;
        }

        .header-join-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 22px;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          text-decoration: none;
          font-size: 14px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.02em;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.24);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
          white-space: nowrap;
        }

        .header-join-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(37, 99, 235, 0.28);
        }

        .header-join-btn-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        [dir='rtl'] .header-join-btn-icon {
          transform: rotate(180deg);
        }

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
        }

        .footer-esaf-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 34px;
        }

        .footer-esaf-top {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px 280px;
          gap: 72px;
          align-items: start;
        }

        .footer-esaf-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-transform: uppercase;
        }

        [dir='rtl'] .footer-esaf-title {
          letter-spacing: -0.03em;
          text-transform: none;
        }

        .footer-esaf-heading {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .footer-esaf-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-esaf-link {
          display: inline-block;
          width: fit-content;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 8px;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-link:hover {
          opacity: 0.78;
        }

        .footer-esaf-email {
          display: inline-block;
          color: #ffffff;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
          direction: ltr;
          unicode-bidi: isolate;
        }

        .footer-esaf-email:hover {
          opacity: 0.78;
        }

        .footer-esaf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
          padding-top: 92px;
        }

        .footer-esaf-copyright {
          margin: 0;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          letter-spacing: -0.02em;
        }

        .mobile-bottom-nav {
          position: fixed;
          left: max(14px, env(safe-area-inset-left, 0px));
          right: max(14px, env(safe-area-inset-right, 0px));
          bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
          z-index: 120;
          display: none;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.82),
              rgba(255, 255, 255, 0.58)
            );
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.18),
            0 6px 18px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1px 0 rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(22px) saturate(1.45);
          -webkit-backdrop-filter: blur(22px) saturate(1.45);
          transform: translate3d(0, 0, 0);
          opacity: 1;
          pointer-events: auto;
          will-change: transform, opacity;
          transition:
            transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.24s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .mobile-bottom-nav--hidden,
        .mobile-bottom-nav.is-hidden-by-scroll,
        .mobile-bottom-nav[data-scroll-hidden='true'] {
          transform: translate3d(0, calc(100% + 42px), 0) !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }

        .mobile-bottom-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(255, 255, 255, 0.78),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.34),
              rgba(255, 255, 255, 0.08)
            );
        }

        .mobile-bottom-nav__inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 70px;
          padding: 0 14px;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #6b7280;
          min-height: 100%;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item:hover {
          color: #111827;
        }

        .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
          filter: grayscale(1) brightness(0.2);
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.55);
          transition: filter 0.2s ease;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
        }


        @media (prefers-color-scheme: dark) {







          .navienty-logo {
            color: #f8fafc;
          }

          .header-join-btn {
            background: #2563eb;
            box-shadow: 0 10px 26px rgba(37, 99, 235, 0.22);
          }

          .header-join-btn:hover {
            box-shadow: 0 12px 30px rgba(37, 99, 235, 0.28);
          }

          .footer-esaf {
            background: #054aff;
          }

          .mobile-bottom-nav {
            border-color: rgba(255, 255, 255, 0.16);
            background:
              linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.78),
                rgba(15, 23, 42, 0.52)
              );
            box-shadow:
              0 18px 45px rgba(0, 0, 0, 0.36),
              0 6px 18px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
            filter: grayscale(1) brightness(0.95);
          }

          .mobile-bottom-nav__item--active {
            color: #60a5fa;
          }

          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) saturate(100%) invert(63%) sepia(98%)
              saturate(961%) hue-rotate(181deg) brightness(101%) contrast(96%);
          }

          .mobile-bottom-nav__icon--image {
            filter: grayscale(1) brightness(0.85);
          }

          [data-community-feed] {
            color-scheme: dark;
          }

          [data-community-feed] button[aria-label*='Previous'],
          [data-community-feed] button[aria-label*='Next'],
          [data-community-feed] button[aria-label*='previous'],
          [data-community-feed] button[aria-label*='next'],
          [data-community-feed] button[aria-label*='السابق'],
          [data-community-feed] button[aria-label*='التالي'],
          [data-community-feed] button[class*='absolute'][class*='rounded-full'] {
            background: rgba(255, 255, 255, 0.96) !important;
            color: #0f172a !important;
            border-color: rgba(15, 23, 42, 0.08) !important;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22) !important;
          }

          [data-community-feed] button[aria-label*='Previous'] svg,
          [data-community-feed] button[aria-label*='Next'] svg,
          [data-community-feed] button[aria-label*='previous'] svg,
          [data-community-feed] button[aria-label*='next'] svg,
          [data-community-feed] button[aria-label*='السابق'] svg,
          [data-community-feed] button[aria-label*='التالي'] svg,
          [data-community-feed] button[class*='absolute'][class*='rounded-full'] svg {
            color: #0f172a !important;
            stroke: #0f172a !important;
            fill: none !important;
          }

          [data-community-feed] button[aria-label*='Previous']:hover,
          [data-community-feed] button[aria-label*='Next']:hover,
          [data-community-feed] button[aria-label*='previous']:hover,
          [data-community-feed] button[aria-label*='next']:hover,
          [data-community-feed] button[aria-label*='السابق']:hover,
          [data-community-feed] button[aria-label*='التالي']:hover,
          [data-community-feed] button[class*='absolute'][class*='rounded-full']:hover {
            background: #ffffff !important;
            color: #020617 !important;
          }
        }


        @media (prefers-color-scheme: dark) {
          [data-community-feed] article,
          [data-community-feed] .post-card,
          [data-community-feed] .feed-post-card {
            background-color: #0b1220;
            border-color: rgba(255, 255, 255, 0.1);
            color: #f8fafc;
          }

          [data-community-feed] p,
          [data-community-feed] span,
          [data-community-feed] h1,
          [data-community-feed] h2,
          [data-community-feed] h3 {
            border-color: rgba(255, 255, 255, 0.1);
          }

          [data-community-feed] button {
            color: inherit;
          }
        }

        @media (max-width: 1100px) {
          .footer-esaf-top {
            grid-template-columns: 1fr 1fr;
            gap: 48px 36px;
          }

          .footer-esaf-top-left {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }

          .header-actions {
            gap: 10px;
          }

          .header-join-btn {
            height: 40px;
            padding: 0 16px;
            font-size: 13px;
            gap: 6px;
          }

          .header-join-btn-icon {
            width: 14px;
            height: 14px;
          }

          .mobile-bottom-nav {
            display: block;
          }

          .footer-esaf-container {
            padding: 48px 22px 28px;
          }

          .footer-esaf-top {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .footer-esaf-title {
            font-size: 36px;
          }

          .footer-esaf-heading {
            font-size: 22px;
            margin-bottom: 14px;
          }

          .footer-esaf-link,
          .footer-esaf-email {
            font-size: 17px;
          }

          .footer-esaf-bottom {
            padding-top: 56px;
            gap: 26px;
          }

          .footer-esaf-copyright {
            font-size: 14px;
          }
        }

        @media (max-width: 420px) {
          .header-join-btn {
            padding: 0 14px;
            font-size: 12px;
          }
        }

        @media (min-width: 769px) {
        }
      `}</style>

      <header className="sticky top-0 z-[110] bg-[#f5f7f9] dark:bg-[#0b1220] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
        <div className="mobile-header-inner flex h-[72px] w-full items-center justify-center px-4 pt-2 md:px-6 lg:px-8">
          <Link
            href={homeHref}
            className="navienty-logo navienty-logo--centered mt-2"
            aria-label="Navienty home"
          >
            <img
              src="https://i.ibb.co/FLsWDBr6/Untitled.png"
              alt="Navienty icon"
              className="navienty-logo-icon"
            />
            <span className="navienty-logo-text-wrap">
              <img
                src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
                alt="Navienty"
                className="navienty-logo-text"
              />
            </span>
          </Link>
        </div>
      </header>

      <section className="px-0 pb-10 md:pb-14">
        <div className="mx-auto w-full max-w-[450px]" data-community-feed>
          {error ? (
            <div className="mx-4 rounded-[20px] bg-white p-5 text-sm font-medium text-red-600 shadow-[0_6px_18px_rgba(0,0,0,0.04)] dark:border dark:border-red-400/20 dark:bg-[#111827] dark:text-red-300 dark:shadow-[0_14px_34px_rgba(0,0,0,0.32)] md:mx-6">
              {t.failedToLoadPosts}
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="mx-4 rounded-[20px] bg-white p-8 text-center text-sm text-[#5b5d68] shadow-[0_6px_18px_rgba(0,0,0,0.04)] dark:border dark:border-white/10 dark:bg-[#111827] dark:text-slate-400 dark:shadow-[0_14px_34px_rgba(0,0,0,0.32)] md:mx-6">
              {t.noPosts}
            </div>
          ) : (
            <div className="pb-2">
              {feedPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  priority={index < 2}
                  showDivider
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="footer-esaf hidden md:block">
        <div className="footer-esaf-container">
          <div className="footer-esaf-top">
            <div className="footer-esaf-top-left">
              <h2 className={`${squadaOne.className} footer-esaf-title`}>
                {t.footerTitle}
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.quickLinks}</h3>
              <div className="footer-esaf-links">
                {footerQuickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-esaf-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.contactUs}</h3>
              <a href={`mailto:${t.footerEmail}`} className="footer-esaf-email">
                {t.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">{t.copyright(currentYear)}</p>
          </div>
        </div>
      </footer>

      <nav
        id="mobile-bottom-nav"
        className="mobile-bottom-nav"
        aria-label="Mobile bottom navigation"
      >
        <div className="mobile-bottom-nav__inner">
          <Link href={propertiesHref} className="mobile-bottom-nav__item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.search}</span>
          </Link>

          <Link
            href={communityHref}
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt="Community"
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link
            href={mobileLanguageHref}
            className="mobile-bottom-nav__item"
            aria-label={mobileLanguageAriaLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.6 9h16.8M3.6 15h16.8M12 3c2.25 2.3 3.3 5.28 3.3 9s-1.05 6.7-3.3 9M12 3C9.75 5.3 8.7 8.28 8.7 12s1.05 6.7 3.3 9"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {mobileLanguageLabel}
            </span>
          </Link>
        </div>
      </nav>

      <Script
        id="community-mobile-bottom-nav-scroll-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var nav = null;
              var lastScrollTop = 0;
              var lastTouchY = 0;
              var lastPointerY = 0;
              var rafId = 0;
              var minDelta = 2;

              function isMobile() {
                return window.matchMedia('(max-width: 768px)').matches;
              }

              function getNav() {
                if (nav && document.documentElement.contains(nav)) return nav;
                nav = document.getElementById('mobile-bottom-nav');
                return nav;
              }

              function forceBaseStyle(currentNav) {
                currentNav.style.setProperty('transition', 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease, visibility 0.24s ease', 'important');
                currentNav.style.setProperty('will-change', 'transform, opacity', 'important');
              }

              function showNav() {
                var currentNav = getNav();
                if (!currentNav) return;
                forceBaseStyle(currentNav);
                currentNav.classList.remove('mobile-bottom-nav--hidden');
                currentNav.classList.remove('is-hidden-by-scroll');
                currentNav.dataset.scrollHidden = 'false';
                currentNav.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
                currentNav.style.setProperty('opacity', '1', 'important');
                currentNav.style.setProperty('pointer-events', 'auto', 'important');
                currentNav.style.setProperty('visibility', 'visible', 'important');
              }

              function hideNav() {
                var currentNav = getNav();
                if (!currentNav || !isMobile()) return;
                forceBaseStyle(currentNav);
                currentNav.classList.add('mobile-bottom-nav--hidden');
                currentNav.classList.add('is-hidden-by-scroll');
                currentNav.dataset.scrollHidden = 'true';
                currentNav.style.setProperty('transform', 'translate3d(0, calc(100% + 56px), 0)', 'important');
                currentNav.style.setProperty('opacity', '0', 'important');
                currentNav.style.setProperty('pointer-events', 'none', 'important');
                currentNav.style.setProperty('visibility', 'hidden', 'important');
              }

              function getWindowScrollTop() {
                return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
              }

              function getScrollParentTopFromEvent(event) {
                var target = event && event.target;
                while (target && target !== document && target !== document.documentElement && target !== document.body) {
                  if (target.scrollHeight > target.clientHeight) {
                    return target.scrollTop || 0;
                  }
                  target = target.parentNode;
                }
                return getWindowScrollTop();
              }

              function applyDirection(delta, currentTop) {
                if (!isMobile()) {
                  showNav();
                  return;
                }

                if (currentTop <= 8) {
                  showNav();
                  return;
                }

                if (Math.abs(delta) < minDelta) return;

                if (delta > 0) {
                  hideNav();
                } else {
                  showNav();
                }
              }

              function scheduleByScroll(event) {
                if (rafId) return;
                rafId = window.requestAnimationFrame(function () {
                  var currentTop = getScrollParentTopFromEvent(event);
                  var delta = currentTop - lastScrollTop;
                  applyDirection(delta, currentTop);
                  lastScrollTop = Math.max(0, currentTop);
                  rafId = 0;
                });
              }

              function onWheel(event) {
                applyDirection(event.deltaY || 0, getWindowScrollTop());
              }

              function onTouchStart(event) {
                if (!event.touches || !event.touches.length) return;
                lastTouchY = event.touches[0].clientY;
              }

              function onTouchMove(event) {
                if (!event.touches || !event.touches.length) return;
                var y = event.touches[0].clientY;
                var delta = lastTouchY - y;
                applyDirection(delta, getWindowScrollTop() || 20);
                lastTouchY = y;
              }

              function onPointerDown(event) {
                lastPointerY = event.clientY || 0;
              }

              function onPointerMove(event) {
                if (!lastPointerY) return;
                var y = event.clientY || 0;
                var delta = lastPointerY - y;
                applyDirection(delta, getWindowScrollTop() || 20);
                lastPointerY = y;
              }

              function bindScrollableElements() {
                var elements = document.querySelectorAll('*');
                for (var i = 0; i < elements.length; i += 1) {
                  var element = elements[i];
                  if (element.__navientyScrollBound) continue;
                  if (element.scrollHeight > element.clientHeight + 8) {
                    element.__navientyScrollBound = true;
                    element.addEventListener('scroll', scheduleByScroll, { passive: true, capture: true });
                  }
                }
              }

              function init() {
                var currentNav = getNav();
                if (!currentNav) {
                  window.setTimeout(init, 80);
                  return;
                }

                lastScrollTop = getWindowScrollTop();
                showNav();
                bindScrollableElements();

                window.addEventListener('scroll', scheduleByScroll, { passive: true, capture: true });
                document.addEventListener('scroll', scheduleByScroll, { passive: true, capture: true });
                document.documentElement.addEventListener('scroll', scheduleByScroll, { passive: true, capture: true });
                document.body.addEventListener('scroll', scheduleByScroll, { passive: true, capture: true });
                window.addEventListener('wheel', onWheel, { passive: true, capture: true });
                document.addEventListener('wheel', onWheel, { passive: true, capture: true });
                window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
                window.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
                document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
                document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
                window.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
                window.addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
                document.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
                document.addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
                window.addEventListener('resize', function () {
                  if (!isMobile()) showNav();
                  bindScrollableElements();
                });
                window.setInterval(bindScrollableElements, 1000);
              }

              init();
            })();
          `,
        }}
      />
    </main>
  );
}
