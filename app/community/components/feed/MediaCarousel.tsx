"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FeedMediaItem } from "./types";

type RenderItemArgs = {
  item: FeedMediaItem;
  index: number;
  isActive: boolean;
};

type MediaCarouselProps = {
  items: FeedMediaItem[];
  renderItem: (args: RenderItemArgs) => ReactNode;
  activeIndex?: number;
  defaultActiveIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  trackClassName?: string;
  slideClassName?: string;
  ariaLabel?: string;
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function useControllableIndex({
  value,
  defaultValue,
  onChange,
  length,
}: {
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  length: number;
}) {
  const isControlled = typeof value === "number";
  const [internalValue, setInternalValue] = useState(() =>
    clampIndex(defaultValue ?? 0, length)
  );

  useEffect(() => {
    setInternalValue((prev) => clampIndex(prev, length));
  }, [length]);

  const currentValue = isControlled
    ? clampIndex(value ?? 0, length)
    : clampIndex(internalValue, length);

  const setValue = useCallback(
    (nextIndex: number) => {
      const safeIndex = clampIndex(nextIndex, length);

      if (!isControlled) {
        setInternalValue(safeIndex);
      }

      onChange?.(safeIndex);
    },
    [isControlled, length, onChange]
  );

  return [currentValue, setValue] as const;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function MediaCarousel({
  items,
  renderItem,
  activeIndex,
  defaultActiveIndex = 0,
  onIndexChange,
  className,
  trackClassName,
  slideClassName,
  ariaLabel = "Post media carousel",
}: MediaCarouselProps) {
  const carouselId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useControllableIndex({
    value: activeIndex,
    defaultValue: defaultActiveIndex,
    onChange: onIndexChange,
    length: items.length,
  });

  const hasMultipleSlides = items.length > 1;

  const getSlideWidth = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return 0;
    return node.clientWidth;
  }, []);

  const getScrollLeftForIndex = useCallback(
    (index: number) => {
      const slideWidth = getSlideWidth();
      return slideWidth * clampIndex(index, items.length);
    },
    [getSlideWidth, items.length]
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const node = scrollRef.current;
      if (!node) return;

      const left = getScrollLeftForIndex(index);

      isProgrammaticScrollRef.current = true;
      node.scrollTo({ left, behavior });

      window.clearTimeout(scrollEndTimeoutRef.current ?? undefined);
      scrollEndTimeoutRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, behavior === "smooth" ? 350 : 120);
    },
    [getScrollLeftForIndex]
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || items.length <= 1) return;

    const targetLeft = getScrollLeftForIndex(currentIndex);

    if (Math.abs(node.scrollLeft - targetLeft) > 2) {
      scrollToIndex(currentIndex, "auto");
    }
  }, [currentIndex, getScrollLeftForIndex, items.length, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollEndTimeoutRef.current) {
        window.clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  const commitIndexFromScrollPosition = useCallback(() => {
    const node = scrollRef.current;
    if (!node || items.length <= 1) return;

    const slideWidth = node.clientWidth;
    if (slideWidth <= 0) return;

    const rawIndex = node.scrollLeft / slideWidth;
    const nextIndex = clampIndex(Math.round(rawIndex), items.length);

    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, items.length, setCurrentIndex]);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      if (isProgrammaticScrollRef.current) return;

      window.clearTimeout(scrollEndTimeoutRef.current ?? undefined);
      scrollEndTimeoutRef.current = window.setTimeout(() => {
        if (isPointerDownRef.current) return;
        commitIndexFromScrollPosition();
      }, 90);
    });
  }, [commitIndexFromScrollPosition]);

  const handlePointerDown = useCallback(() => {
    isPointerDownRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;

    window.clearTimeout(scrollEndTimeoutRef.current ?? undefined);
    scrollEndTimeoutRef.current = window.setTimeout(() => {
      commitIndexFromScrollPosition();
    }, 60);
  }, [commitIndexFromScrollPosition]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasMultipleSlides) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(currentIndex + 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    },
    [currentIndex, hasMultipleSlides, scrollToIndex]
  );

  const slides = useMemo(
    () =>
      items.map((item, index) => {
        const isActive = index === currentIndex;
        const rendered = renderItem({ item, index, isActive });

        const maybeCloned =
          isValidElement(rendered) && typeof rendered.type !== "string"
            ? cloneElement(rendered, {
                "data-active-slide": isActive ? "true" : "false",
              } as Record<string, unknown>)
            : rendered;

        return (
          <div
            key={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            aria-hidden={!isActive}
            className={cx(
              "relative h-full w-full shrink-0 snap-center snap-always overflow-hidden",
              slideClassName
            )}
          >
            {maybeCloned}
          </div>
        );
      }),
    [currentIndex, items, renderItem, slideClassName]
  );

  if (!items.length) {
    return null;
  }

  if (items.length === 1) {
    return (
      <div
        dir="ltr"
        className={cx("relative h-full w-full overflow-hidden", className)}
        aria-label={ariaLabel}
      >
        {renderItem({
          item: items[0],
          index: 0,
          isActive: true,
        })}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={cx("relative h-full w-full [direction:ltr]", className)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        id={carouselId}
        dir="ltr"
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cx(
          [
            "scrollbar-none flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
            "touch-pan-x overscroll-x-contain",
            "scroll-smooth [scroll-behavior:smooth] [direction:ltr]",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            "[-webkit-overflow-scrolling:touch]",
          ].join(" "),
          trackClassName
        )}
      >
        {slides}
      </div>
    </div>
  );
}