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

type ImageSize = {
  width: number;
  height: number;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function getKnownImageSize(item?: FeedMediaItem): ImageSize | null {
  if (!item || item.type !== "image") return null;
  if (!item.width || !item.height) return null;

  return {
    width: item.width,
    height: item.height,
  };
}

function getSafeAspectRatio(size: ImageSize | null) {
  if (!size?.width || !size?.height) return null;

  const ratio = size.width / size.height;

  if (!Number.isFinite(ratio) || ratio <= 0) return null;

  return ratio;
}

function resolveFallbackAspectRatio(
  aspectRatio: PostMediaProps["aspectRatio"],
  activeItem?: FeedMediaItem
) {
  if (activeItem?.type === "video") return 9 / 16;

  if (aspectRatio === "square") return 1;
  if (aspectRatio === "portrait") return 4 / 5;

  if (aspectRatio === "instagram") {
    const knownSize = getKnownImageSize(activeItem);
    const knownRatio = getSafeAspectRatio(knownSize);

    if (knownRatio) {
      if (knownRatio >= 1.2) return 1.91;
      if (knownRatio >= 0.95 && knownRatio <= 1.05) return 1;
      return 4 / 5;
    }

    return 4 / 5;
  }

  return 4 / 5;
}

export default function PostMedia({
  media,
  altFallback = "Post media",
  priority = false,
  initialIndex = 0,
  aspectRatio = "auto",
  className,
  onOpenMedia,
}: PostMediaProps) {
  const safeInitialIndex = clampIndex(initialIndex, media.length);
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  const [loadedImageSizes, setLoadedImageSizes] = useState<Record<string, ImageSize>>({});

  const activeItem = media[activeIndex];
  const hasMultipleMedia = media.length > 1;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < media.length - 1;

  const activeImageSize = useMemo(() => {
    if (!activeItem || activeItem.type !== "image") return null;

    const knownSize = getKnownImageSize(activeItem);

    if (knownSize) return knownSize;

    return loadedImageSizes[String(activeItem.id)] ?? null;
  }, [activeItem, loadedImageSizes]);

  const activeAspectRatio = useMemo(() => {
    if (!activeItem) return 4 / 5;

    if (activeItem.type === "video") return 9 / 16;

    const imageRatio = getSafeAspectRatio(activeImageSize);

    if (aspectRatio === "auto" && imageRatio) {
      return imageRatio;
    }

    if (aspectRatio === "auto") {
      return resolveFallbackAspectRatio("instagram", activeItem);
    }

    return resolveFallbackAspectRatio(aspectRatio, activeItem);
  }, [activeImageSize, activeItem, aspectRatio]);

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

  const handleImageLoad = (
    item: FeedMediaItem,
    event: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const image = event.currentTarget;
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height) return;

    setLoadedImageSizes((prev) => {
      const key = String(item.id);
      const existing = prev[key];

      if (existing?.width === width && existing?.height === height) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          width,
          height,
        },
      };
    });
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
      <div className="relative overflow-hidden rounded-[24px] bg-neutral-100 dark:bg-neutral-900">
        <div
          className="relative w-full transition-[aspect-ratio] duration-200"
          style={{
            aspectRatio: activeAspectRatio,
          }}
        >
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
                    className="relative h-full w-full cursor-pointer bg-black"
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
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain"
                    onLoad={(event) => handleImageLoad(item, event)}
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