import PropertiesHeader from "../PropertiesHeader"

const AMENITY_COUNT = 6
const BOOKING_OPTION_COUNT = 3
const DESKTOP_SIMILAR_COUNT = 4

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`navienty-property-shimmer ${className}`}
    />
  )
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M15.75 19.5 8.25 12l7.5-7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="m8 11 7.8-4.5M8 13l7.8 4.5" strokeLinecap="round" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path
        d="m5.5 17 4.2-4.2a1.6 1.6 0 0 1 2.25 0l1.35 1.35 1.45-1.45a1.6 1.6 0 0 1 2.25 0L19 14.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MobileGallerySkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative h-[clamp(370px,49svh,440px)] overflow-hidden bg-slate-200 dark:bg-slate-800"
    >
      <div className="navienty-property-photo-skeleton absolute inset-0" />

      <div
        className="absolute left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] bg-white text-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
        dir="ltr"
      >
        <BackIcon />
      </div>

      <div
        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] bg-white text-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
        dir="ltr"
      >
        <ShareIcon />
      </div>

      <div className="absolute bottom-[34px] left-4 z-20 flex h-9 min-w-[48px] items-center justify-center rounded-full bg-slate-950/90 px-3 shadow-lg">
        <ShimmerBlock className="navienty-property-shimmer--on-dark h-3 w-7 rounded-full" />
      </div>

      <div
        className="absolute bottom-[clamp(32px,8.5vw,38px)] left-1/2 z-20 flex -translate-x-1/2 items-center justify-center"
        dir="ltr"
      >
        <div className="flex h-10 items-center justify-center gap-[7px] rounded-full border border-slate-900/15 bg-white/95 px-[14px] text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/95 dark:text-slate-100">
          <PhotoIcon />
          <ShimmerBlock className="h-3 w-[62px] rounded-full" />
        </div>
      </div>
    </section>
  )
}

function AddressSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center rounded-full border border-slate-200 bg-white shadow-[0_7px_20px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220] ${
        compact
          ? "h-10 w-fit gap-2 px-3"
          : "min-h-[52px] w-full max-w-[350px] gap-3 px-4"
      }`}
      dir="rtl"
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#eef3ff] dark:bg-blue-400/10 ${
          compact ? "h-7 w-7" : "h-9 w-9"
        }`}
      >
        <ShimmerBlock
          className={`navienty-property-shimmer--accent rounded-full ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          }`}
        />
      </div>

      <ShimmerBlock
        className={`rounded-full ${
          compact ? "h-3 w-[128px]" : "h-3.5 w-[72%]"
        }`}
      />
    </div>
  )
}

function BrokerCardSkeleton({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#dce8f8] shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827] ${
        desktop ? "h-[250px]" : "h-[190px]"
      }`}
      dir="ltr"
    >
      <div className="navienty-property-support-background absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/5 via-transparent to-white/10 dark:from-black/20 dark:to-transparent" />

      <div className="absolute left-4 top-3 z-10 flex items-center gap-3">
        <div className="rounded-full border-2 border-white bg-white p-1 shadow-md dark:border-white/10 dark:bg-[#0b1220]">
          <ShimmerBlock
            className={`${desktop ? "h-14 w-14" : "h-12 w-12"} rounded-full`}
          />
        </div>

        <div className="space-y-2">
          <ShimmerBlock className="navienty-property-shimmer--on-image h-4 w-32 rounded-full" />
          <ShimmerBlock className="navienty-property-shimmer--on-image h-3 w-20 rounded-full" />
        </div>
      </div>

      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-end gap-3">
        <div className="flex h-10 w-[142px] items-center gap-2 rounded-xl bg-white/[0.92] px-3 shadow-md backdrop-blur-md dark:bg-[#0b1220]/[0.92]">
          <ShimmerBlock className="navienty-property-shimmer--accent h-4 w-4 shrink-0 rounded-full" />
          <ShimmerBlock className="h-3 w-[86px] rounded-full" />
        </div>

        <div className="flex h-10 w-[132px] items-center gap-2 rounded-xl bg-white/[0.92] px-3 shadow-md backdrop-blur-md dark:bg-[#0b1220]/[0.92]">
          <ShimmerBlock className="navienty-property-shimmer--accent h-4 w-4 shrink-0 rounded-full" />
          <ShimmerBlock className="h-3 w-[76px] rounded-full" />
        </div>
      </div>
    </div>
  )
}

function AmenitiesSkeleton({ desktop = false }: { desktop?: boolean }) {
  return (
    <section
      aria-hidden="true"
      className={
        desktop
          ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220]"
          : "mt-6 border-b border-slate-200 px-1 pb-8 dark:border-white/10 sm:px-2"
      }
    >
      <ShimmerBlock className="h-7 w-52 rounded-full" />

      <div
        className={`mt-6 grid grid-cols-2 ${
          desktop ? "gap-x-8 gap-y-5" : "gap-x-5 gap-y-5"
        }`}
      >
        {Array.from({ length: AMENITY_COUNT }).map((_, index) => (
          <div
            key={`amenity-${index}`}
            className="flex min-w-0 items-center gap-3"
          >
            <ShimmerBlock className="h-9 w-9 shrink-0 rounded-xl" />
            <ShimmerBlock className="h-3.5 w-[68%] rounded-full" />
          </div>
        ))}
      </div>

      <ShimmerBlock className="navienty-property-shimmer--accent mt-7 h-11 w-40 rounded-[18px]" />
    </section>
  )
}

function MapSkeleton({ desktop = false }: { desktop?: boolean }) {
  return (
    <section
      aria-hidden="true"
      className={
        desktop
          ? "mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220]"
          : "border-b border-slate-200 px-1 pb-8 pt-6 dark:border-white/10 sm:px-2"
      }
    >
      <ShimmerBlock className="h-7 w-36 rounded-full" />
      <ShimmerBlock className="mt-4 h-4 w-[68%] rounded-full" />

      <div
        className={`relative mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900 ${
          desktop ? "h-[430px]" : "h-[300px]"
        }`}
      >
        <div className="navienty-property-map-pattern absolute inset-0" />

        <div className="absolute -left-[8%] top-[32%] h-[5px] w-[116%] rotate-[12deg] rounded-full bg-white/90 dark:bg-white/10" />
        <div className="absolute -left-[7%] top-[68%] h-[5px] w-[116%] -rotate-[9deg] rounded-full bg-white/90 dark:bg-white/10" />
        <div className="absolute left-[28%] top-[-10%] h-[120%] w-[4px] rotate-[7deg] rounded-full bg-white/80 dark:bg-white/10" />
        <div className="absolute right-[24%] top-[-8%] h-[118%] w-[3px] -rotate-[10deg] rounded-full bg-white/80 dark:bg-white/10" />

        <ShimmerBlock className="navienty-property-shimmer--accent absolute left-[47%] top-[43%] h-12 w-12 rounded-full border-[5px] border-white shadow-[0_8px_22px_rgba(15,23,42,0.20)] dark:border-[#0b1220]" />
        <ShimmerBlock className="absolute right-4 top-4 h-11 w-11 rounded-full border border-white shadow-md dark:border-white/10" />
      </div>
    </section>
  )
}

function SimilarPropertyCardSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <article
      aria-hidden="true"
      className={`shrink-0 overflow-hidden bg-[#f6f6f6] shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:bg-[#0b1220] dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)] ${
        mobile ? "w-[280px] rounded-[28px]" : "rounded-[22px]"
      }`}
    >
      <ShimmerBlock
        className={`w-full ${
          mobile
            ? "h-[190px] rounded-[28px]"
            : "h-[165px] rounded-[22px]"
        }`}
      />

      <div className={mobile ? "px-4 pb-5 pt-4" : "px-4 pb-4 pt-3"}>
        <ShimmerBlock className="h-4 w-[82%] rounded-full" />
        <ShimmerBlock className="mt-2 h-3 w-[34%] rounded-full" />
        <ShimmerBlock className="mt-2 h-10 w-full rounded-full" />

        <div className="mt-3 flex items-center gap-2">
          <ShimmerBlock className="h-4 w-[28%] rounded-full" />
          <ShimmerBlock className="h-5 w-[42%] rounded-full" />
        </div>
      </div>
    </article>
  )
}

function MobileSimilarPropertiesSkeleton() {
  return (
    <section aria-hidden="true" className="px-5 pb-6 pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <ShimmerBlock className="h-7 w-44 rounded-full" />
        <ShimmerBlock className="h-10 w-24 rounded-full" />
      </div>

      <div className="-mx-5 overflow-hidden px-5">
        <div className="flex gap-4 pb-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <SimilarPropertyCardSkeleton
              key={`mobile-similar-${index}`}
              mobile
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function DesktopSimilarPropertiesSkeleton() {
  return (
    <section aria-hidden="true" className="mt-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <ShimmerBlock className="h-7 w-48 rounded-full" />
        <ShimmerBlock className="h-10 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: DESKTOP_SIMILAR_COUNT }).map((_, index) => (
          <SimilarPropertyCardSkeleton key={`desktop-similar-${index}`} />
        ))}
      </div>
    </section>
  )
}

function MobileContentSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative -mt-7 rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] dark:bg-[#050816] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-white/15" />

      <div className="text-center">
        <div className="flex justify-center">
          <ShimmerBlock className="h-7 w-[76%] max-w-[310px] rounded-full" />
        </div>

        <div className="mt-4 flex justify-center">
          <AddressSkeleton />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <ShimmerBlock className="h-4 w-[58%] rounded-full" />
          <ShimmerBlock className="h-4 w-[18%] rounded-full" />
        </div>
      </div>

      <div className="mt-6">
        <BrokerCardSkeleton />
      </div>

      <div className="navienty-property-deferred-section">
        <AmenitiesSkeleton />
        <MapSkeleton />
        <MobileSimilarPropertiesSkeleton />
      </div>
    </section>
  )
}

function DesktopGallerySkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative mt-5 grid h-[520px] grid-cols-2 gap-2 overflow-hidden rounded-[28px] lg:grid-cols-[1.55fr_1fr]"
    >
      <div className="navienty-property-photo-skeleton h-full w-full" />

      <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`desktop-gallery-${index}`}
            className="navienty-property-photo-skeleton h-full min-h-0 w-full"
          />
        ))}
      </div>

      <ShimmerBlock className="absolute bottom-5 left-5 h-12 w-44 rounded-full border border-white/80 shadow-lg" />
      <ShimmerBlock className="absolute bottom-5 right-5 h-12 w-36 rounded-full border border-white/80 shadow-lg" />
    </section>
  )
}

function BookingOptionsSkeleton() {
  return (
    <section aria-hidden="true" className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <ShimmerBlock className="h-7 w-40 rounded-full" />
      </div>

      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220]">
        <ShimmerBlock className="h-4 w-40 rounded-full" />

        <div className="mt-4 grid grid-cols-2 rounded-[18px] bg-slate-100 p-1 dark:bg-white/[0.06]">
          <ShimmerBlock className="navienty-property-shimmer--accent h-11 rounded-[15px]" />

          <div className="flex items-center justify-center">
            <ShimmerBlock className="h-4 w-24 rounded-full" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {Array.from({ length: BOOKING_OPTION_COUNT }).map((_, index) => (
            <article
              key={`booking-option-${index}`}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1220]"
            >
              <ShimmerBlock className="h-5 w-32 rounded-full" />

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                <div className="rounded-[18px] bg-[#f5f7fb] px-4 py-3 dark:bg-white/[0.05]">
                  <ShimmerBlock className="h-3 w-14 rounded-full" />
                  <ShimmerBlock className="mt-2 h-7 w-40 rounded-full" />
                </div>

                <ShimmerBlock className="navienty-property-shimmer--accent h-14 rounded-[18px]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DesktopContentSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto hidden max-w-[1400px] px-4 py-5 sm:px-6 md:block lg:px-7"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <ShimmerBlock className="h-8 w-[46%] rounded-full" />

            <div className="mt-3">
              <AddressSkeleton compact />
            </div>
          </div>

          <ShimmerBlock className="h-11 w-28 rounded-full" />
        </div>
      </div>

      <DesktopGallerySkeleton />

      <section className="mt-6 border-b border-slate-200 pb-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="h-4 w-80 rounded-full" />
          <ShimmerBlock className="h-4 w-24 rounded-full" />
        </div>
      </section>

      <section className="mt-8">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <AmenitiesSkeleton desktop />

          <section className="space-y-6 xl:sticky xl:top-24">
            <BrokerCardSkeleton desktop />
          </section>
        </div>
      </section>

      <div className="navienty-property-deferred-section">
        <MapSkeleton desktop />
        <BookingOptionsSkeleton />
        <DesktopSimilarPropertiesSkeleton />
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
          <ShimmerBlock className="navienty-property-shimmer--footer h-20 w-[78%] rounded-3xl" />

          <div className="space-y-4">
            <ShimmerBlock className="navienty-property-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-property-shimmer--footer h-5 w-24 rounded-full" />
            <ShimmerBlock className="navienty-property-shimmer--footer h-5 w-20 rounded-full" />
            <ShimmerBlock className="navienty-property-shimmer--footer h-5 w-24 rounded-full" />
          </div>

          <div className="space-y-4">
            <ShimmerBlock className="navienty-property-shimmer--footer h-7 w-32 rounded-full" />
            <ShimmerBlock className="navienty-property-shimmer--footer h-5 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function MobileBookingCtaSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="navienty-property-loading-cta md:hidden"
      dir="rtl"
    >
      <div className="navienty-property-loading-button flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-full bg-[#054aff] shadow-[0_12px_30px_rgba(5,74,255,0.25)]">
        <ShimmerBlock className="navienty-property-shimmer--button-label h-3.5 w-24 rounded-full" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      aria-label="جاري تحميل تفاصيل السكن"
      className="relative min-h-screen overflow-x-hidden bg-white pb-24 text-gray-700 md:pb-0 dark:bg-[#050816] dark:text-slate-100"
      dir="rtl"
    >
      <style>{`
        @keyframes navienty-property-shimmer-animation {
          0% {
            transform: translate3d(-115%, 0, 0);
          }

          100% {
            transform: translate3d(115%, 0, 0);
          }
        }

        .navienty-property-shimmer,
        .navienty-property-photo-skeleton,
        .navienty-property-loading-button {
          contain: paint;
        }

        .navienty-property-shimmer {
          position: relative;
          overflow: hidden;
          background: #e7edf4;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.035);
        }

        .navienty-property-shimmer::after,
        .navienty-property-photo-skeleton::after,
        .navienty-property-loading-button::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translate3d(-115%, 0, 0);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 24%,
            rgba(255, 255, 255, 0.68) 50%,
            rgba(255, 255, 255, 0.18) 76%,
            transparent 100%
          );
          animation: navienty-property-shimmer-animation 1.45s ease-in-out infinite;
          will-change: transform;
          pointer-events: none;
        }

        .navienty-property-photo-skeleton {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 72% 32%,
              rgba(255, 255, 255, 0.50) 0,
              rgba(255, 255, 255, 0.50) 14%,
              transparent 14.5%
            ),
            radial-gradient(
              circle at 26% 70%,
              rgba(148, 163, 184, 0.20) 0,
              rgba(148, 163, 184, 0.20) 18%,
              transparent 18.5%
            ),
            linear-gradient(135deg, #d6dde6 0%, #edf1f5 54%, #dce3eb 100%);
        }

        .navienty-property-shimmer--accent {
          background: #155dfc;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 8px 20px rgba(5, 74, 255, 0.16);
        }

        .navienty-property-shimmer--accent::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 24%,
            rgba(255, 255, 255, 0.34) 50%,
            rgba(255, 255, 255, 0.06) 76%,
            transparent 100%
          );
        }

        .navienty-property-shimmer--on-dark,
        .navienty-property-shimmer--on-image,
        .navienty-property-shimmer--button-label {
          background: rgba(255, 255, 255, 0.34);
          box-shadow: none;
        }

        .navienty-property-shimmer--on-dark::after,
        .navienty-property-shimmer--on-image::after,
        .navienty-property-shimmer--button-label::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 24%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.04) 76%,
            transparent 100%
          );
        }

        .navienty-property-shimmer--footer {
          background: rgba(255, 255, 255, 0.23);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .navienty-property-shimmer--footer::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 24%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.04) 76%,
            transparent 100%
          );
        }

        .navienty-property-support-background {
          background:
            linear-gradient(
              145deg,
              rgba(219, 234, 254, 0.50),
              rgba(203, 213, 225, 0.14)
            ),
            radial-gradient(
              circle at 75% 28%,
              rgba(255, 255, 255, 0.48) 0,
              rgba(255, 255, 255, 0.48) 12%,
              transparent 12.5%
            ),
            repeating-linear-gradient(
              -18deg,
              transparent 0,
              transparent 28px,
              rgba(255, 255, 255, 0.16) 29px,
              rgba(255, 255, 255, 0.16) 31px
            );
        }

        .navienty-property-map-pattern {
          background:
            radial-gradient(
              circle at 18% 20%,
              rgba(203, 213, 225, 0.70) 0,
              rgba(203, 213, 225, 0.70) 9%,
              transparent 9.5%
            ),
            radial-gradient(
              circle at 76% 30%,
              rgba(203, 213, 225, 0.54) 0,
              rgba(203, 213, 225, 0.54) 13%,
              transparent 13.5%
            ),
            radial-gradient(
              circle at 42% 76%,
              rgba(203, 213, 225, 0.60) 0,
              rgba(203, 213, 225, 0.60) 15%,
              transparent 15.5%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.70),
              rgba(226, 232, 240, 0.48)
            );
        }

        .navienty-property-loading-cta {
          position: fixed;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
          z-index: 220;
          width: calc(100% - 28px);
          max-width: 430px;
          transform: translateX(-50%);
        }

        .navienty-property-loading-button::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 30%,
            rgba(255, 255, 255, 0.18) 50%,
            rgba(255, 255, 255, 0.04) 70%,
            transparent 100%
          );
        }

        .navienty-property-deferred-section {
          content-visibility: auto;
          contain-intrinsic-size: 1200px;
        }

        @media (prefers-color-scheme: dark) {
          .navienty-property-shimmer {
            background: #172033;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
          }

          .navienty-property-shimmer::after {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.03) 24%,
              rgba(255, 255, 255, 0.11) 50%,
              rgba(255, 255, 255, 0.03) 76%,
              transparent 100%
            );
          }

          .navienty-property-photo-skeleton {
            background:
              radial-gradient(
                circle at 72% 32%,
                rgba(255, 255, 255, 0.07) 0,
                rgba(255, 255, 255, 0.07) 14%,
                transparent 14.5%
              ),
              radial-gradient(
                circle at 26% 70%,
                rgba(96, 165, 250, 0.07) 0,
                rgba(96, 165, 250, 0.07) 18%,
                transparent 18.5%
              ),
              linear-gradient(135deg, #111827, #1e293b);
          }

          .navienty-property-shimmer--accent {
            background: #155dfc;
          }

          .navienty-property-support-background {
            background:
              linear-gradient(145deg, #172033, #111827),
              radial-gradient(
                circle at 75% 28%,
                rgba(96, 165, 250, 0.06) 0,
                rgba(96, 165, 250, 0.06) 12%,
                transparent 12.5%
              ),
              repeating-linear-gradient(
                -18deg,
                transparent 0,
                transparent 28px,
                rgba(255, 255, 255, 0.03) 29px,
                rgba(255, 255, 255, 0.03) 31px
              );
          }

          .navienty-property-map-pattern {
            background:
              radial-gradient(
                circle at 18% 20%,
                rgba(96, 165, 250, 0.10) 0,
                rgba(96, 165, 250, 0.10) 9%,
                transparent 9.5%
              ),
              radial-gradient(
                circle at 76% 30%,
                rgba(148, 163, 184, 0.10) 0,
                rgba(148, 163, 184, 0.10) 13%,
                transparent 13.5%
              ),
              radial-gradient(
                circle at 42% 76%,
                rgba(148, 163, 184, 0.08) 0,
                rgba(148, 163, 184, 0.08) 15%,
                transparent 15.5%
              ),
              linear-gradient(135deg, #172033, #111827);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .navienty-property-shimmer::after,
          .navienty-property-photo-skeleton::after,
          .navienty-property-loading-button::after {
            display: none;
            animation: none;
          }
        }
      `}</style>

      <span className="sr-only" role="status">
        جاري تحميل تفاصيل السكن
      </span>

      <PropertiesHeader
        homeHref="/properties"
        t={{ startSearch: "ابدأ بحثك" }}
      />

      <div className="md:hidden">
        <MobileGallerySkeleton />
        <MobileContentSkeleton />
      </div>

      <DesktopContentSkeleton />
      <FooterSkeleton />
      <MobileBookingCtaSkeleton />
    </main>
  )
}
