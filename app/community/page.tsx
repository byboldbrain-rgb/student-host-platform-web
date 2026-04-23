import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Squada_One } from "next/font/google";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PostCard from "./components/feed/PostCard";
import type { FeedPost } from "./components/feed/types";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});

const footerQuickLinks = [
  { label: "About us", href: "/about" },
  { label: "Board", href: "/board" },
  { label: "Contact", href: "/contact" },
];

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function PillButton({
  children,
  as = "button",
  href,
}: {
  children: React.ReactNode;
  as?: "button" | "link";
  href?: string;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,0.25)] transition hover:scale-[1.02] md:px-6 md:py-3.5 md:text-sm";

  if (as === "link" && href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}

function SectionTitle({ black, purple }: { black: string; purple: string }) {
  return (
    <h2 className="text-3xl font-bold leading-none tracking-[-0.04em] text-[#20212a] md:text-5xl xl:text-[60px]">
      {black} <span className="text-blue-600">{purple}</span>
    </h2>
  );
}

function normalizePosts(posts: CommunityPost[]): FeedPost[] {
  return posts.map((post) => {
    const activeAssets = (post.community_post_assets || [])
      .filter((asset) => asset.is_active && asset.file_url)
      .sort((a, b) => a.sort_order - b.sort_order);

    const media: FeedPost["media"] = activeAssets.map((asset) => ({
      id: asset.id,
      type: asset.asset_type,
      src: asset.file_url,
      poster: asset.thumbnail_url || null,
      alt: asset.alt_text || post.title_en,
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
        alt: post.title_en,
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
        name: post.author_name || "Navienty Team",
        handle: "navienty",
        avatarUrl: "https://i.ibb.co/p6CBgjz0/Navienty-13.png",
        verified: true,
      },
      createdAt: post.published_at || post.created_at,
      caption: post.excerpt_en || post.content_en || post.title_en,
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

export default async function CommunityPage() {
  const currentYear = new Date().getFullYear();
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
  const feedPosts = normalizePosts(posts);

  return (
    <main className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] md:pb-0">
      <style>{`
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
      `}</style>

      <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
        <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
          <Link
            href="/properties?lang=en&currency=EGP"
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
            <Link href="/community/join" className="header-join-btn">
              <span>Join Us</span>
              <ArrowRight className="header-join-btn-icon" />
            </Link>
          </div>
        </div>
      </header>

      <section className="px-0 pb-10 md:pb-14">
        <div className="mx-auto w-full max-w-[450px]">
          {error ? (
            <div className="mx-4 rounded-[20px] bg-white p-5 text-sm font-medium text-red-600 shadow-[0_6px_18px_rgba(0,0,0,0.04)] md:mx-6">
              Failed to load community posts.
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="mx-4 rounded-[20px] bg-white p-8 text-center text-sm text-[#5b5d68] shadow-[0_6px_18px_rgba(0,0,0,0.04)] md:mx-6">
              No posts published yet.
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
                Find your way to better student living
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">Quick Links</h3>
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
              <h3 className="footer-esaf-heading">Contact Us</h3>
              <a
                href="mailto:info@navienty.com"
                className="footer-esaf-email"
              >
                info@navienty.com
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">
              © {currentYear} Navienty | All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <div className="mobile-bottom-nav__inner">
          <Link href="/properties" className="mobile-bottom-nav__item">
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
            <span className="mobile-bottom-nav__label">Search</span>
          </Link>

          <Link
            href="/community"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt="Community"
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">Community</span>
          </Link>

          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="mobile-bottom-nav__item"
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
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {isLoggedIn ? "Account" : "Login"}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}