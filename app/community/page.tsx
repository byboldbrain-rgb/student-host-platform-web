import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Squada_One } from "next/font/google";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PostCard from "./components/feed/PostCard";
import type { FeedPost } from "./components/feed/types";
import CommunityNotifications from "./CommunityNotifications";
import CommunityFeedVideoAutoplay from "./CommunityFeedVideoAutoplay";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});

const APP_LOGO_URL = "https://i.ibb.co/sn0xS95/Navienty-2.jpg";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    community: "Community",
    account: "Account",
    login: "Login",
    navientyTeam: "Navienty Team",
    copyright: (year: number) =>
      `© ${year} Navienty | All rights reserved.`,
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
    community: "المجتمع",
    account: "الحساب",
    login: "تسجيل الدخول",
    navientyTeam: "فريق نافينتي",
    copyright: (year: number) =>
      `© ${year} نافينتي | جميع الحقوق محفوظة.`,
  },
} as const;

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeCurrency(value?: string) {
  return value?.trim().toUpperCase() || "EGP";
}

function buildUrl(
  path: string,
  language: SupportedLanguage,
  currency: string
) {
  const params = new URLSearchParams();
  params.set("lang", language);
  params.set("currency", currency);

  return `${path}?${params.toString()}`;
}

function normalizePosts(
  posts: CommunityPost[],
  language: SupportedLanguage,
  t: (typeof TRANSLATIONS)["en"] | (typeof TRANSLATIONS)["ar"]
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
        avatarUrl: "https://i.ibb.co/p6CBgjz0/Navienty-13.png",
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

  const cookieStore = await cookies();

  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op in Server Component
        },
      },
    }
  );

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const isLoggedIn = !!user;

  const { data, error } = await supabase
    .from("community_posts")
    .select(`
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
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const posts: CommunityPost[] = (data as CommunityPost[] | null) ?? [];
  const feedPosts = normalizePosts(posts, selectedLanguage, t);

  const homeHref = buildUrl("/properties", selectedLanguage, selectedCurrency);
  const joinHref = buildUrl(
    "/community/join",
    selectedLanguage,
    selectedCurrency
  );
  const propertiesHref = buildUrl(
    "/properties",
    selectedLanguage,
    selectedCurrency
  );
  const communityHref = buildUrl(
    "/community",
    selectedLanguage,
    selectedCurrency
  );
  const accountHref = buildUrl(
    isLoggedIn ? "/account" : "/account-login",
    selectedLanguage,
    selectedCurrency
  );

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
      className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <div className="pwa-install-banner" id="pwa-install-banner">
        <button
          type="button"
          className="pwa-install-banner__close"
          aria-label="Close app install banner"
          id="pwa-install-banner-close"
        >
          ×
        </button>

        <img
          src={APP_LOGO_URL}
          alt="Navienty"
          className="pwa-install-banner__logo"
          draggable={false}
        />

        <div className="pwa-install-banner__content">
          <p className="pwa-install-banner__title">Continue in the app!</p>
        </div>

        <button
          type="button"
          className="pwa-install-banner__button"
          id="pwa-install-banner-button"
        >
          Get App
        </button>

        <div className="pwa-install-banner__ios-help" id="pwa-install-banner-ios-help">
          On iPhone: tap Share, then choose Add to Home Screen.
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var banner = document.getElementById('pwa-install-banner');
              var closeButton = document.getElementById('pwa-install-banner-close');
              var installButton = document.getElementById('pwa-install-banner-button');
              var iosHelp = document.getElementById('pwa-install-banner-ios-help');
              var deferredPrompt = null;

              if (!banner) return;

              function isStandalone() {
                return window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;
              }

              function isIos() {
                var ua = window.navigator.userAgent.toLowerCase();
                var platform = (window.navigator.platform || '').toLowerCase();
                return /iphone|ipad|ipod/.test(ua) ||
                  (platform === 'macintel' && window.navigator.maxTouchPoints > 1);
              }

              function hideBanner() {
                banner.style.display = 'none';
              }

              function showBanner() {
                banner.style.display = 'grid';
              }

              if (isStandalone()) {
                hideBanner();
                return;
              }

              if (localStorage.getItem('pwa-install-banner-dismissed') === 'true') {
                hideBanner();
                return;
              }

              if (isIos()) {
                showBanner();
              }

              window.addEventListener('beforeinstallprompt', function (event) {
                event.preventDefault();
                deferredPrompt = event;
                showBanner();
              });

              window.addEventListener('appinstalled', function () {
                localStorage.setItem('pwa-install-banner-dismissed', 'true');
                hideBanner();
                deferredPrompt = null;
              });

              if (closeButton) {
                closeButton.addEventListener('click', function () {
                  localStorage.setItem('pwa-install-banner-dismissed', 'true');
                  hideBanner();
                });
              }

              if (installButton) {
                installButton.addEventListener('click', function () {
                  if (isIos()) {
                    if (iosHelp) {
                      iosHelp.classList.toggle('pwa-install-banner__ios-help--visible');
                    }
                    return;
                  }

                  if (!deferredPrompt) return;

                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(function (choiceResult) {
                    if (choiceResult && choiceResult.outcome === 'accepted') {
                      localStorage.setItem('pwa-install-banner-dismissed', 'true');
                      hideBanner();
                    }
                    deferredPrompt = null;
                  });
                });
              }
            })();
          `,
        }}
      />

      <CommunityNotifications />
      <CommunityFeedVideoAutoplay />

      <style>{`
        .pwa-install-banner {
          position: sticky;
          top: 0;
          z-index: 160;
          display: none;
          grid-template-columns: 26px 46px minmax(0, 1fr) auto;
          align-items: center;
          gap: 9px;
          min-height: 62px;
          background: #ffffff;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          padding: 8px 12px;
        }

        .pwa-install-banner__close {
          width: 26px;
          height: 26px;
          border: 0;
          background: transparent;
          color: #111827;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }

        .pwa-install-banner__logo {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          display: block;
        }

        .pwa-install-banner__content {
          min-width: 0;
        }

        .pwa-install-banner__title {
          margin: 0;
          color: #111827;
          font-size: 15px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pwa-install-banner__button {
          min-width: 86px;
          height: 38px;
          border: 0;
          border-radius: 9px;
          background: #054aff;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          padding: 0 16px;
        }

        .pwa-install-banner__ios-help {
          display: none;
          grid-column: 1 / -1;
          margin-top: 6px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.4;
        }

        .pwa-install-banner__ios-help--visible {
          display: block;
        }

        @media (display-mode: standalone) {
          .pwa-install-banner {
            display: none !important;
          }
        }

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-decoration: none;
          transform: translateY(-7px);
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
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: none;
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.08);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 64px;
          padding: 0 8px;
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
          .pwa-install-banner {
            background: rgba(11, 18, 32, 0.98);
            border-bottom-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
          }

          .pwa-install-banner__close {
            color: #f8fafc;
          }

          .pwa-install-banner__logo {
            border-color: rgba(255, 255, 255, 0.12);
            background: #0b1220;
          }

          .pwa-install-banner__title {
            color: #f8fafc;
          }

          .pwa-install-banner__button {
            background: #2563eb;
          }

          .pwa-install-banner__button:hover {
            background: #1d4ed8;
          }

          .pwa-install-banner__ios-help {
            background: #111827;
            border-color: rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
          }

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
            background: rgba(11, 18, 32, 0.96);
            border-top-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.28);
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
            justify-content: space-between !important;
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
          .pwa-install-banner {
            display: none !important;
          }
        }
      `}</style>

      <header className="sticky top-0 z-[110] bg-[#f5f7f9] dark:bg-[#0b1220] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
        <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
          <Link
            href={homeHref}
            className="navienty-logo mt-2"
            aria-label="Navienty home"
          >
            <img
              src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
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

          <div className="header-actions">
            <Link href={joinHref} className="header-join-btn">
              <span>{t.joinUs}</span>
              <ArrowRight className="header-join-btn-icon" />
            </Link>
          </div>
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
              <a
                href={`mailto:${t.footerEmail}`}
                className="footer-esaf-email"
              >
                {t.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">
              {t.copyright(currentYear)}
            </p>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
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

          <Link href={accountHref} className="mobile-bottom-nav__item">
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
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {isLoggedIn ? t.account : t.login}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
