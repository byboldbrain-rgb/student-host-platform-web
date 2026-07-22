const SKELETON_SECTION_COUNT = 3
const MOBILE_CARD_COUNT = 4
const DESKTOP_PRIMARY_CARD_COUNT = 4

const HOME_HERO_DESKTOP_IMAGE = '/images/home/home-hero-v3.webp'
const HOME_HERO_MOBILE_IMAGE = '/images/home/home-hero-v5.webp'

function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`navienty-route-shimmer ${className}`}
    />
  )
}

function PropertyCardSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0">
      <ShimmerBlock className="aspect-[4/3] w-full rounded-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] md:rounded-[28px]" />

      <div className="mt-2.5 space-y-1.5 md:mt-3.5">
        <ShimmerBlock className="h-[21px] w-[86%] rounded-full md:h-[22px]" />
        <ShimmerBlock className="h-4 w-[38%] rounded-full" />
        <ShimmerBlock className="h-5 w-[58%] rounded-full" />
      </div>
    </div>
  )
}

function SeeAllCardSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center">
        <ShimmerBlock className="absolute h-[65%] w-[65%] -translate-x-3 -translate-y-2 -rotate-12 rounded-lg border-2 border-white shadow-sm dark:border-slate-700 md:rounded-xl md:border-[3px]" />
        <ShimmerBlock className="absolute h-[65%] w-[65%] translate-x-3 -translate-y-2 rotate-12 rounded-lg border-2 border-white shadow-sm dark:border-slate-700 md:rounded-xl md:border-[3px]" />
        <ShimmerBlock className="absolute z-10 h-[70%] w-[70%] rounded-lg border-2 border-white shadow-md dark:border-slate-700 md:rounded-xl md:border-[3px]" />
      </div>

      <div className="mt-2 flex justify-center pt-2 md:mt-3">
        <ShimmerBlock className="h-4 w-20 rounded-full" />
      </div>
    </div>
  )
}

function HeroSearchSkeleton() {
  return (
    <>
      <div className="hidden w-full max-w-[980px] items-center gap-2 rounded-[30px] bg-white/95 p-2.5 shadow-[0_24px_70px_rgba(3,12,28,0.28)] ring-1 ring-white/75 md:flex dark:bg-slate-950/90 dark:ring-white/10">
        <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`hero-search-desktop-field-${index}`}
              className="min-w-0 space-y-2 px-5 py-2"
            >
              <ShimmerBlock className="h-3 w-16 rounded-full" />
              <ShimmerBlock className="h-4 w-[78%] rounded-full" />
            </div>
          ))}
        </div>

        <ShimmerBlock className="navienty-route-shimmer--accent h-16 w-16 shrink-0 rounded-full" />
      </div>

      <div className="flex h-[64px] w-full items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-[0_18px_45px_rgba(3,12,28,0.24)] ring-1 ring-white/80 md:hidden dark:bg-slate-950/92 dark:ring-white/10">
        <div className="min-w-0 flex-1 px-4">
          <ShimmerBlock className="h-2.5 w-12 rounded-full" />
          <ShimmerBlock className="mt-1.5 h-3.5 w-24 max-w-[68%] rounded-full" />
        </div>

        <div className="flex h-[52px] w-[88px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#dce6fb] px-3 dark:bg-[#18366f]">
          <ShimmerBlock className="navienty-route-shimmer--on-soft-blue h-4 w-4 rounded-full" />
          <ShimmerBlock className="navienty-route-shimmer--on-soft-blue h-3 w-7 rounded-full" />
        </div>
      </div>
    </>
  )
}

function HeroSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative isolate z-[100] mb-10 min-h-[460px] overflow-visible md:mb-14 md:min-h-[540px]"
    >
      <div className="absolute inset-0 overflow-hidden rounded-b-[42px] bg-[#182235] md:rounded-b-[78px]">
        <picture className="absolute inset-0 block h-full w-full">
          <source
            media="(max-width: 767px)"
            srcSet={HOME_HERO_MOBILE_IMAGE}
          />
          <img
            src={HOME_HERO_DESKTOP_IMAGE}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[1.06] contrast-[1.04] saturate-[1.04] md:object-[center_42%]"
          />
        </picture>

        <div className="pointer-events-none absolute inset-0 bg-black/20 md:hidden" />
        <div className="navienty-loading-hero-side pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[460px] max-w-[1600px] flex-col justify-center px-5 pb-14 pt-16 sm:px-8 md:min-h-[540px] md:px-14 md:pb-20 md:pt-16 lg:px-20 xl:px-28">
        <div className="w-full max-w-[820px]">
          <div className="flex flex-col items-start gap-3 md:gap-4">
            <ShimmerBlock className="navienty-route-shimmer--hero h-9 w-[66%] max-w-[250px] rounded-[10px] sm:h-11 sm:max-w-[330px] md:h-14 md:w-[78%] md:max-w-none lg:h-16" />
            <ShimmerBlock className="navienty-route-shimmer--hero h-9 w-[46%] max-w-[185px] rounded-[10px] sm:h-11 sm:max-w-[250px] md:h-14 md:w-[54%] md:max-w-none lg:h-16" />
            <ShimmerBlock className="navienty-route-shimmer--hero mt-1 h-2.5 w-24 rounded-full opacity-80 md:h-3 md:w-[28%]" />
          </div>

          <div className="relative z-30 mt-8 w-full scroll-mt-28 lg:mt-10">
            <HeroSearchSkeleton />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading properties"
      className="relative min-h-screen overflow-x-hidden bg-white pb-32 text-gray-700 dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <style>{`
        @keyframes navienty-route-shimmer-animation {
          0% {
            transform: translateX(-115%);
          }

          100% {
            transform: translateX(115%);
          }
        }

        .navienty-route-shimmer {
          overflow: hidden;
          background: #e8edf3;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.04);
        }

        .navienty-route-shimmer:not(.absolute):not(.fixed):not(.sticky) {
          position: relative;
        }

        .navienty-route-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-115%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.24) 24%,
            rgba(255, 255, 255, 0.82) 50%,
            rgba(255, 255, 255, 0.24) 76%,
            transparent 100%
          );
          animation: navienty-route-shimmer-animation 1.35s ease-in-out infinite;
          will-change: transform;
        }

        .navienty-route-shimmer.navienty-route-shimmer--hero {
          background: rgba(255, 255, 255, 0.22);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .navienty-route-shimmer.navienty-route-shimmer--hero::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 24%,
            rgba(255, 255, 255, 0.34) 50%,
            rgba(255, 255, 255, 0.04) 76%,
            transparent 100%
          );
        }

        .navienty-route-shimmer.navienty-route-shimmer--accent {
          background: #1765ff;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 10px 24px rgba(5, 74, 255, 0.18);
        }

        .navienty-route-shimmer.navienty-route-shimmer--accent::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 24%,
            rgba(255, 255, 255, 0.34) 50%,
            rgba(255, 255, 255, 0.08) 76%,
            transparent 100%
          );
        }

        .navienty-route-shimmer.navienty-route-shimmer--on-soft-blue {
          background: rgba(255, 255, 255, 0.88);
          box-shadow: none;
        }

        .navienty-route-shimmer.navienty-route-shimmer--on-soft-blue::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 24%,
            rgba(255, 255, 255, 0.72) 50%,
            rgba(255, 255, 255, 0.18) 76%,
            transparent 100%
          );
        }

        .navienty-route-shimmer.navienty-route-shimmer--footer {
          background: rgba(255, 255, 255, 0.24);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .navienty-route-shimmer.navienty-route-shimmer--footer::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 24%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.04) 76%,
            transparent 100%
          );
        }

        .navienty-loading-hero-side {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          display: none;
          width: 72%;
          background: linear-gradient(
            to right,
            rgba(7, 17, 31, 0.8),
            rgba(7, 17, 31, 0.48),
            transparent
          );
        }

        [dir='rtl'] .navienty-loading-hero-side {
          right: 0;
          left: auto;
          background: linear-gradient(
            to left,
            rgba(7, 17, 31, 0.8),
            rgba(7, 17, 31, 0.48),
            transparent
          );
        }

        .navienty-loading-mobile-nav {
          position: fixed;
          left: max(14px, env(safe-area-inset-left, 0px));
          right: max(14px, env(safe-area-inset-right, 0px));
          bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
          z-index: 120;
          display: none;
          height: 70px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          background: linear-gradient(
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
        }

        .navienty-loading-mobile-nav::before {
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

        .navienty-loading-mobile-nav__inner {
          position: relative;
          z-index: 1;
          display: grid;
          height: 70px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          padding: 0 14px;
        }

        @media (min-width: 768px) {
          .navienty-loading-hero-side {
            display: block;
          }
        }

        @media (max-width: 767px) {
          .navienty-loading-mobile-nav {
            display: block;
          }
        }

        @media (prefers-color-scheme: dark) {
          .navienty-route-shimmer {
            background: #172033;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
          }

          .navienty-route-shimmer::after {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.03) 24%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0.03) 76%,
              transparent 100%
            );
          }

          .navienty-loading-mobile-nav {
            border-color: rgba(255, 255, 255, 0.16);
            background: linear-gradient(
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
        }

        .dark .navienty-route-shimmer {
          background: #172033;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
        }

        .dark .navienty-route-shimmer::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 24%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.03) 76%,
            transparent 100%
          );
        }

        .dark .navienty-route-shimmer.navienty-route-shimmer--hero {
          background: rgba(255, 255, 255, 0.22);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .dark .navienty-route-shimmer.navienty-route-shimmer--accent {
          background: #1765ff;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 10px 24px rgba(5, 74, 255, 0.18);
        }

        .dark .navienty-route-shimmer.navienty-route-shimmer--on-soft-blue {
          background: rgba(255, 255, 255, 0.74);
          box-shadow: none;
        }

        .dark .navienty-route-shimmer.navienty-route-shimmer--footer {
          background: rgba(255, 255, 255, 0.24);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .dark .navienty-loading-mobile-nav {
          border-color: rgba(255, 255, 255, 0.16);
          background: linear-gradient(
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

        @media (prefers-reduced-motion: reduce) {
          .navienty-route-shimmer::after {
            display: none;
            animation: none;
          }
        }
      `}</style>

      <span className="sr-only">Loading properties</span>

      <HeroSkeleton />

      <div className="relative z-0 mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <section className="mb-10 space-y-10 md:mb-14 md:space-y-12">
          {Array.from({ length: SKELETON_SECTION_COUNT }).map(
            (_, sectionIndex) => (
              <div key={`loading-section-${sectionIndex}`}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <ShimmerBlock className="h-6 w-44 rounded-full md:h-7 md:w-64" />
                  <ShimmerBlock className="h-7 w-7 rounded-full md:hidden" />
                </div>

                <div className="flex gap-4 overflow-hidden pb-4 md:gap-5 lg:hidden">
                  {Array.from({ length: MOBILE_CARD_COUNT }).map(
                    (_, cardIndex) => (
                      <div
                        key={`loading-mobile-card-${sectionIndex}-${cardIndex}`}
                        className="min-w-[240px] max-w-[240px] shrink-0 md:min-w-[260px] md:max-w-[260px]"
                      >
                        <PropertyCardSkeleton />
                      </div>
                    ),
                  )}
                </div>

                <div className="hidden gap-5 pb-4 lg:grid lg:grid-cols-5 2xl:grid-cols-6 2xl:gap-6">
                  {Array.from({ length: DESKTOP_PRIMARY_CARD_COUNT }).map(
                    (_, cardIndex) => (
                      <PropertyCardSkeleton
                        key={`loading-desktop-primary-${sectionIndex}-${cardIndex}`}
                      />
                    ),
                  )}

                  <div className="hidden 2xl:block">
                    <PropertyCardSkeleton />
                  </div>

                  <SeeAllCardSkeleton />
                </div>
              </div>
            ),
          )}
        </section>
      </div>

      <div
        aria-hidden="true"
        className="mt-14 hidden min-h-[320px] bg-[#054aff] px-8 py-16 md:block"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1.5fr)_320px_280px] items-start gap-[72px]">
          <ShimmerBlock className="navienty-route-shimmer--footer h-16 w-[82%] rounded-2xl lg:h-20" />

          <div className="space-y-4">
            <ShimmerBlock className="navienty-route-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-route-shimmer--footer h-5 w-24 rounded-full" />
            <ShimmerBlock className="navienty-route-shimmer--footer h-5 w-20 rounded-full" />
            <ShimmerBlock className="navienty-route-shimmer--footer h-5 w-24 rounded-full" />
          </div>

          <div className="space-y-4">
            <ShimmerBlock className="navienty-route-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-route-shimmer--footer h-5 w-48 rounded-full" />
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-7xl justify-center">
          <ShimmerBlock className="navienty-route-shimmer--footer h-4 w-56 rounded-full" />
        </div>
      </div>

      <div className="navienty-loading-mobile-nav" aria-hidden="true">
        <div className="navienty-loading-mobile-nav__inner">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`loading-mobile-nav-${index}`}
              className="flex min-h-full flex-col items-center justify-center gap-1"
            >
              <ShimmerBlock
                className={`h-[22px] w-[22px] rounded-full ${
                  index === 0 ? 'navienty-route-shimmer--accent' : ''
                }`}
              />

              <ShimmerBlock className="h-2.5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
