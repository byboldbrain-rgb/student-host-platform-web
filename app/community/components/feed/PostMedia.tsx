"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaCarousel from "./MediaCarousel";
import FeedVideo from "./FeedVideo";
import type { FeedMediaItem } from "./types";

type PostMediaProps = {
  media: FeedMediaItem[];
  altFallback?: string;
  priority?: boolean;
  initialIndex?: number;
  aspectRatio?: "square" | "portrait" | "auto" | "instagram";
  className?: string;
  onOpenMedia?: (index: number) => void;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function resolveInstagramImageAspectClass(activeItem?: FeedMediaItem) {
  if (!activeItem?.width || !activeItem?.height) {
    return "aspect-[4/5]";
  }

  const ratio = activeItem.width / activeItem.height;

  // Instagram landscape post = 1.91:1
  if (ratio >= 1.2) return "aspect-[1.91]";
  // Instagram square post = 1:1
  if (ratio >= 0.95 && ratio <= 1.05) return "aspect-square";
  // Instagram portrait post = 4:5
  return "aspect-[4/5]";
}

function resolveAspectClass(
  aspectRatio: PostMediaProps["aspectRatio"],
  activeItem?: FeedMediaItem
) {
  if (aspectRatio === "square") return "aspect-square";
  if (aspectRatio === "portrait") return "aspect-[4/5]";

  if (aspectRatio === "instagram") {
    if (activeItem?.type === "video") {
      return "aspect-[9/16]";
    }

    return resolveInstagramImageAspectClass(activeItem);
  }

  if (!activeItem?.width || !activeItem?.height) {
    return "aspect-[4/5]";
  }

  const ratio = activeItem.width / activeItem.height;

  if (activeItem.type === "video") return "aspect-[9/16]";
  if (ratio >= 1.2) return "aspect-[1.91]";
  if (ratio <= 0.85) return "aspect-[4/5]";
  return "aspect-square";
}

export default function PostMedia({
  media,
  altFallback = "Post media",
  priority = false,
  initialIndex = 0,
  aspectRatio = "instagram",
  className,
  onOpenMedia,
}: PostMediaProps) {
  const safeInitialIndex = clampIndex(initialIndex, media.length);
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);

  const activeItem = media[activeIndex];
  const hasMultipleMedia = media.length > 1;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < media.length - 1;

  const aspectClass = useMemo(
    () => resolveAspectClass(aspectRatio, activeItem),
    [aspectRatio, activeItem]
  );

  const goPrev = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (!canGoPrev) return;
    setActiveIndex((prev) => prev - 1);
  };

  const goNext = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (!canGoNext) return;
    setActiveIndex((prev) => prev + 1);
  };

  if (!media.length) {
    return (
      <div
        className={cx(
          "relative overflow-hidden rounded-[24px] bg-neutral-100 dark:bg-neutral-900",
          className
        )}
      >
        <div className="grid aspect-[4/5] place-items-center text-center">
          <div className="px-6 text-sm text-neutral-500 dark:text-neutral-400">
            No media available.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("relative", className)}>
      <div className="relative overflow-hidden rounded-[24px] bg-black">
        <div className={cx("relative w-full", aspectClass)}>
          <MediaCarousel
            items={media}
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
            ariaLabel="Post media"
            renderItem={({ item, index, isActive }) => {
              const handleClick = () => {
                onOpenMedia?.(index);
              };

              if (item.type === "video") {
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    className="relative h-full w-full cursor-pointer"
                    onClick={handleClick}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleClick();
                      }
                    }}
                  >
                    <FeedVideo
                      src={item.src}
                      poster={item.poster}
                      alt={item.alt ?? altFallback}
                      isActiveSlide={isActive}
                      durationMs={item.durationMs ?? null}
                    />
                  </div>
                );
              }

              return (
                <div
                  role="button"
                  tabIndex={0}
                  className="relative h-full w-full cursor-pointer bg-neutral-100 dark:bg-neutral-900"
                  onClick={handleClick}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleClick();
                    }
                  }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt ?? altFallback}
                    fill
                    priority={priority && index === 0}
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                </div>
              );
            }}
          />

          {hasMultipleMedia && canGoPrev ? (
  <button
    type="button"
    onClick={goPrev}
    aria-label="Previous media"
    className={cx(
      "absolute left-2.5 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center md:flex",
      "h-8 w-8 rounded-full",
      "bg-white/88 text-neutral-600",
      "border border-black/5",
      "shadow-[0_1px_2px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.14)]",
      "backdrop-blur-[2px]",
      "transition-opacity duration-150",
      "hover:bg-white/92",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/20"
    )}
  >
    <ChevronLeft className="h-4 w-4 stroke-[2.75]" />
  </button>
) : null}

{hasMultipleMedia && canGoNext ? (
  <button
    type="button"
    onClick={goNext}
    aria-label="Next media"
    className={cx(
      "absolute right-2.5 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center md:flex",
      "h-8 w-8 rounded-full",
      "bg-white/88 text-neutral-600",
      "border border-black/5",
      "shadow-[0_1px_2px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.14)]",
      "backdrop-blur-[2px]",
      "transition-opacity duration-150",
      "hover:bg-white/92",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/20"
    )}
  >
    <ChevronRight className="h-4 w-4 stroke-[2.75]" />
  </button>
) : null}

          {hasMultipleMedia && canGoNext ? (
  <button
    type="button"
    onClick={goNext}
    aria-label="Next media"
    className={cx(
      "absolute right-2.5 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center md:flex",
      "h-8 w-8 rounded-full",
      "bg-white/88 text-neutral-600",
      "border border-black/5",
      "shadow-[0_1px_2px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.14)]",
      "backdrop-blur-[2px]",
      "transition-opacity duration-150",
      "hover:bg-white/92",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/20"
    )}
  >
    <ChevronRight className="h-4 w-4 stroke-[2.75]" />
  </button>
) : null}

          {hasMultipleMedia ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 px-16">
              {media.slice(0, 6).map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <span
                    key={item.id}
                    className={cx(
                      "h-1.5 rounded-full transition-all duration-200",
                      isActive ? "w-5 bg-white" : "w-1.5 bg-white/55"
                    )}
                  />
                );
              })}

              {media.length > 6 ? (
                <span className="ml-1 text-[10px] font-medium text-white/85">
                  +{media.length - 6}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}