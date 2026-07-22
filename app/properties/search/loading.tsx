const DESKTOP_CARD_COUNT = 6

function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`navienty-search-shimmer ${className}`}
    />
  )
}

function MobileHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="navienty-loading-mobile-header md:hidden"
    >
      <div className="flex h-[82px] items-center justify-center">
        <ShimmerBlock className="navienty-search-shimmer--brand h-10 w-8 rounded-md" />
      </div>

      <div className="px-3 pb-2">
        <div
          className="flex h-[62px] items-center overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#0b1220]"
          dir="rtl"
        >
          <div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-x-reverse divide-slate-200 dark:divide-white/10">
            <div className="space-y-2 px-5">
              <ShimmerBlock className="h-3 w-14 rounded-full" />
              <ShimmerBlock className="h-4 w-[72%] rounded-full" />
            </div>

            <div className="space-y-2 px-5">
              <ShimmerBlock className="h-3 w-14 rounded-full" />
              <ShimmerBlock className="h-4 w-[68%] rounded-full" />
            </div>
          </div>

          <ShimmerBlock className="navienty-search-shimmer--accent h-[50px] w-[82px] shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function DesktopHeaderSkeleton() {
  return (
    <header
      aria-hidden="true"
      className="sticky top-0 z-[140] hidden border-b border-slate-100 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#050816]/95 md:block"
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center gap-5 px-6 lg:px-8">
        <ShimmerBlock className="navienty-search-shimmer--brand h-12 w-10 shrink-0 rounded-md" />

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="flex h-16 w-full max-w-[760px] items-center rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_8px_26px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0b1220]">
            <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-slate-200 dark:divide-white/10">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`desktop-search-field-${index}`}
                  className="min-w-0 space-y-1.5 px-4"
                >
                  <ShimmerBlock className="h-2.5 w-12 rounded-full" />
                  <ShimmerBlock className="h-3.5 w-[72%] rounded-full" />
                </div>
              ))}
            </div>

            <ShimmerBlock className="navienty-search-shimmer--accent h-[52px] w-[68px] shrink-0 rounded-full" />
          </div>
        </div>

        <ShimmerBlock className="h-11 w-11 shrink-0 rounded-full" />
      </div>
    </header>
  )
}

function PriceMarkerSkeleton({
  className = '',
  widthClass = 'w-[86px]',
}: {
  className?: string
  widthClass?: string
}) {
  return (
    <ShimmerBlock
      className={`absolute h-9 ${widthClass} rounded-full border-2 border-white shadow-[0_6px_16px_rgba(15,23,42,0.22)] dark:border-[#0b1220] ${className}`}
    />
  )
}

function MobileMapSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="navienty-loading-mobile-map md:hidden"
    >
      <div className="absolute inset-0 navienty-loading-map-background" />

      <div className="absolute left-[-8%] top-[24%] h-[5px] w-[118%] rotate-[15deg] rounded-full bg-white/90 dark:bg-white/10" />
      <div className="absolute left-[-5%] top-[61%] h-[6px] w-[116%] -rotate-[12deg] rounded-full bg-white/90 dark:bg-white/10" />
      <div className="absolute left-[25%] top-[-8%] h-[120%] w-[4px] rotate-[8deg] rounded-full bg-white/80 dark:bg-white/10" />
      <div className="absolute right-[20%] top-[-4%] h-[115%] w-[3px] -rotate-[11deg] rounded-full bg-white/80 dark:bg-white/10" />

      <PriceMarkerSkeleton className="left-[27%] top-[7%]" widthClass="w-[90px]" />
      <PriceMarkerSkeleton className="left-[33%] top-[21%]" widthClass="w-[94px]" />
      <PriceMarkerSkeleton className="left-[49%] top-[31%]" widthClass="w-[96px]" />
      <PriceMarkerSkeleton className="left-[27%] top-[38%]" widthClass="w-[88px]" />
      <PriceMarkerSkeleton className="left-[43%] top-[47%]" widthClass="w-[92px]" />
      <PriceMarkerSkeleton className="left-[55%] top-[56%]" widthClass="w-[84px]" />
      <PriceMarkerSkeleton className="left-[30%] top-[65%]" widthClass="w-[98px]" />
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <article aria-hidden="true" className="min-w-0">
      <ShimmerBlock className="aspect-[4/3] w-full rounded-[18px] shadow-[0_6px_18px_rgba(15,23,42,0.06)] md:rounded-[28px]" />

      <div className="mt-2.5 space-y-1.5 md:mt-3">
        <ShimmerBlock className="h-[17px] w-[84%] rounded-full md:h-5" />
        <ShimmerBlock className="h-3 w-[34%] rounded-full" />
        <div className="flex items-center gap-2 pt-0.5">
          <ShimmerBlock className="h-4 w-[42%] rounded-full" />
          <ShimmerBlock className="h-3 w-[16%] rounded-full" />
        </div>
      </div>
    </article>
  )
}

function MobileBottomSheetSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="navienty-loading-mobile-sheet md:hidden"
    >
      <div className="flex justify-center pb-3 pt-2">
        <div className="h-1 w-11 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>

      <div className="px-4 pb-[140px]">
        <div className="relative">
          <ShimmerBlock className="aspect-[4/3] w-full rounded-[20px] shadow-[0_7px_22px_rgba(15,23,42,0.08)]" />

          <ShimmerBlock className="absolute right-3 top-3 h-9 w-[74px] rounded-full border border-white/80 shadow-md dark:border-white/10" />
        </div>

        <div className="mt-3 space-y-2">
          <ShimmerBlock className="h-5 w-[82%] rounded-full" />
          <ShimmerBlock className="h-3.5 w-[36%] rounded-full" />
          <ShimmerBlock className="h-4 w-[48%] rounded-full" />
        </div>

        <div className="mt-8">
          <PropertyCardSkeleton />
        </div>
      </div>
    </section>
  )
}

function SortSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mb-8 hidden items-center md:flex"
    >
      <div className="flex h-12 w-48 items-center justify-between rounded-full border border-slate-200 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
        <ShimmerBlock className="h-4 w-24 rounded-full" />
        <ShimmerBlock className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

function AlertCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mb-8 hidden overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1220] lg:block"
    >
      <div className="flex min-h-[112px] items-center justify-between gap-8">
        <div className="min-w-0 flex-1 space-y-3">
          <ShimmerBlock className="h-7 w-[48%] max-w-[390px] rounded-full" />
          <ShimmerBlock className="h-4 w-[68%] max-w-[560px] rounded-full" />
          <ShimmerBlock className="h-4 w-[42%] max-w-[340px] rounded-full" />
        </div>

        <ShimmerBlock className="navienty-search-shimmer--accent h-12 w-40 shrink-0 rounded-full" />
      </div>
    </div>
  )
}

function DesktopMapSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="sticky top-28 hidden h-[calc(100vh-8rem)] min-h-[560px] overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-[#eef2f5] shadow-sm dark:border-white/10 dark:bg-[#111827] lg:block"
    >
      <div className="absolute inset-0 navienty-loading-map-background" />

      <div className="absolute left-[10%] top-[18%] h-[3px] w-[86%] rotate-[18deg] rounded-full bg-white/80 dark:bg-white/10" />
      <div className="absolute -left-[4%] top-[48%] h-[4px] w-[108%] -rotate-[13deg] rounded-full bg-white/90 dark:bg-white/10" />
      <div className="absolute left-[28%] top-[4%] h-[94%] w-[3px] rotate-[8deg] rounded-full bg-white/80 dark:bg-white/10" />
      <div className="absolute right-[20%] top-[8%] h-[90%] w-[3px] -rotate-[10deg] rounded-full bg-white/80 dark:bg-white/10" />

      <PriceMarkerSkeleton className="left-[14%] top-[14%]" />
      <PriceMarkerSkeleton className="right-[12%] top-[24%]" widthClass="w-24" />
      <PriceMarkerSkeleton className="left-[42%] top-[38%]" widthClass="w-24" />
      <PriceMarkerSkeleton className="left-[12%] top-[57%]" />
      <PriceMarkerSkeleton className="right-[18%] top-[68%]" />
      <PriceMarkerSkeleton className="left-[38%] top-[81%]" widthClass="w-24" />
    </aside>
  )
}

function PaginationSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-16 flex items-center justify-center gap-3 py-4"
      dir="ltr"
    >
      <ShimmerBlock className="h-10 w-10 rounded-full" />
      <ShimmerBlock className="navienty-search-shimmer--accent h-10 w-10 rounded-full" />
      <ShimmerBlock className="h-10 w-10 rounded-full" />
      <ShimmerBlock className="h-10 w-10 rounded-full" />
      <ShimmerBlock className="h-10 w-10 rounded-full" />
    </div>
  )
}

function DesktopContentSkeleton() {
  return (
    <section className="mx-auto hidden max-w-7xl px-6 py-10 md:block lg:px-8">
      <SortSkeleton />
      <AlertCardSkeleton />

      <div
        className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,52%)_minmax(420px,48%)]"
        dir="ltr"
      >
        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Array.from({ length: DESKTOP_CARD_COUNT }).map((_, index) => (
              <PropertyCardSkeleton key={`desktop-property-${index}`} />
            ))}
          </div>

          <PaginationSkeleton />
        </div>

        <DesktopMapSkeleton />
      </div>
    </section>
  )
}

function MobileBottomNavSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="navienty-loading-mobile-nav md:hidden"
      dir="rtl"
    >
      <div className="navienty-loading-mobile-nav__inner">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`loading-mobile-nav-${index}`}
            className="flex min-h-full flex-col items-center justify-center gap-1.5"
          >
            <ShimmerBlock
              className={`h-[22px] w-[22px] rounded-full ${
                index === 0 ? 'navienty-search-shimmer--accent' : ''
              }`}
            />
            <ShimmerBlock className="h-2.5 w-10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FooterSkeleton() {
  return (
    <footer
      aria-hidden="true"
      className="mt-14 hidden min-h-[320px] bg-[#054aff] md:block"
    >
      <div className="mx-auto max-w-7xl px-12 pb-9 pt-[72px]">
        <div className="grid grid-cols-[minmax(0,1.5fr)_320px_280px] items-start gap-[72px]">
          <ShimmerBlock className="navienty-search-shimmer--footer h-20 w-[78%] rounded-3xl" />

          <div className="space-y-4">
            <ShimmerBlock className="navienty-search-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-search-shimmer--footer h-5 w-24 rounded-full" />
            <ShimmerBlock className="navienty-search-shimmer--footer h-5 w-20 rounded-full" />
            <ShimmerBlock className="navienty-search-shimmer--footer h-5 w-24 rounded-full" />
          </div>

          <div className="space-y-4">
            <ShimmerBlock className="navienty-search-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-search-shimmer--footer h-5 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading search results"
      className="relative min-h-screen overflow-x-hidden bg-white text-gray-700 dark:bg-[#050816] dark:text-slate-100"
    >
      <style>{`
        @keyframes navienty-search-shimmer-animation {
          0% {
            transform: translateX(-115%);
          }

          100% {
            transform: translateX(115%);
          }
        }

        .navienty-search-shimmer {
          position: relative;
          overflow: hidden;
          background: #e7edf4;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.035);
        }

        .navienty-search-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-115%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.24) 24%,
            rgba(255, 255, 255, 0.84) 50%,
            rgba(255, 255, 255, 0.24) 76%,
            transparent 100%
          );
          animation: navienty-search-shimmer-animation 1.35s ease-in-out infinite;
          will-change: transform;
        }

        .navienty-search-shimmer--accent {
          background: #155dfc;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 8px 20px rgba(5, 74, 255, 0.18);
        }

        .navienty-search-shimmer--accent::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 24%,
            rgba(255, 255, 255, 0.38) 50%,
            rgba(255, 255, 255, 0.08) 76%,
            transparent 100%
          );
        }

        .navienty-search-shimmer--brand {
          background: #155dfc;
        }

        .navienty-search-shimmer--brand::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 24%,
            rgba(255, 255, 255, 0.38) 50%,
            rgba(255, 255, 255, 0.08) 76%,
            transparent 100%
          );
        }

        .navienty-search-shimmer--footer {
          background: rgba(255, 255, 255, 0.23);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .navienty-search-shimmer--footer::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 24%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.04) 76%,
            transparent 100%
          );
        }

        .navienty-loading-mobile-header {
          position: relative;
          z-index: 150;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
        }

        .navienty-loading-mobile-map {
          position: relative;
          height: clamp(330px, 43svh, 430px);
          overflow: hidden;
          background: #ebe8e5;
        }

        .navienty-loading-map-background {
          background:
            radial-gradient(
              circle at 18% 22%,
              rgba(203, 213, 225, 0.72) 0,
              rgba(203, 213, 225, 0.72) 8%,
              transparent 8.5%
            ),
            radial-gradient(
              circle at 76% 32%,
              rgba(203, 213, 225, 0.58) 0,
              rgba(203, 213, 225, 0.58) 11%,
              transparent 11.5%
            ),
            radial-gradient(
              circle at 40% 74%,
              rgba(203, 213, 225, 0.62) 0,
              rgba(203, 213, 225, 0.62) 14%,
              transparent 14.5%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.68),
              rgba(226, 232, 240, 0.44)
            );
        }

        .navienty-loading-mobile-sheet {
          position: relative;
          z-index: 20;
          min-height: 520px;
          margin-top: -18px;
          border-radius: 28px 28px 0 0;
          background: #ffffff;
          box-shadow: 0 -10px 28px rgba(15, 23, 42, 0.12);
        }

        .navienty-loading-mobile-nav {
          position: fixed;
          left: max(14px, env(safe-area-inset-left, 0px));
          right: max(14px, env(safe-area-inset-right, 0px));
          bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
          z-index: 220;
          height: 70px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.88),
              rgba(244, 238, 235, 0.80)
            );
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.20),
            0 6px 18px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.90),
            inset 0 -1px 0 rgba(255, 255, 255, 0.52);
          backdrop-filter: blur(22px) saturate(1.4);
          -webkit-backdrop-filter: blur(22px) saturate(1.4);
        }

        .navienty-loading-mobile-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(255, 255, 255, 0.82),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.38),
              rgba(255, 255, 255, 0.10)
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

        @media (prefers-color-scheme: dark) {
          .navienty-search-shimmer {
            background: #172033;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
          }

          .navienty-search-shimmer::after {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.03) 24%,
              rgba(255, 255, 255, 0.11) 50%,
              rgba(255, 255, 255, 0.03) 76%,
              transparent 100%
            );
          }

          .navienty-search-shimmer--accent,
          .navienty-search-shimmer--brand {
            background: #155dfc;
          }

          .navienty-loading-mobile-header {
            background: rgba(5, 8, 22, 0.97);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
          }

          .navienty-loading-mobile-map {
            background: #111827;
          }

          .navienty-loading-map-background {
            background:
              radial-gradient(
                circle at 18% 22%,
                rgba(96, 165, 250, 0.10) 0,
                rgba(96, 165, 250, 0.10) 8%,
                transparent 8.5%
              ),
              radial-gradient(
                circle at 76% 32%,
                rgba(148, 163, 184, 0.10) 0,
                rgba(148, 163, 184, 0.10) 11%,
                transparent 11.5%
              ),
              radial-gradient(
                circle at 40% 74%,
                rgba(148, 163, 184, 0.08) 0,
                rgba(148, 163, 184, 0.08) 14%,
                transparent 14.5%
              ),
              linear-gradient(135deg, #172033, #111827);
          }

          .navienty-loading-mobile-sheet {
            background: #050816;
            box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.32);
          }

          .navienty-loading-mobile-nav {
            border-color: rgba(255, 255, 255, 0.16);
            background:
              linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.84),
                rgba(15, 23, 42, 0.62)
              );
            box-shadow:
              0 18px 45px rgba(0, 0, 0, 0.36),
              0 6px 18px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          }
        }

        .dark .navienty-loading-mobile-header {
          background: rgba(5, 8, 22, 0.97);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
        }

        .dark .navienty-loading-mobile-map {
          background: #111827;
        }

        .dark .navienty-loading-mobile-sheet {
          background: #050816;
          box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.32);
        }

        .dark .navienty-loading-mobile-nav {
          border-color: rgba(255, 255, 255, 0.16);
          background:
            linear-gradient(
              135deg,
              rgba(15, 23, 42, 0.84),
              rgba(15, 23, 42, 0.62)
            );
        }

        @media (prefers-reduced-motion: reduce) {
          .navienty-search-shimmer::after {
            display: none;
            animation: none;
          }
        }
      `}</style>

      <span className="sr-only">Loading search results</span>

      <MobileHeaderSkeleton />
      <MobileMapSkeleton />
      <MobileBottomSheetSkeleton />

      <DesktopHeaderSkeleton />
      <DesktopContentSkeleton />
      <FooterSkeleton />

      <MobileBottomNavSkeleton />
    </main>
  )
}
