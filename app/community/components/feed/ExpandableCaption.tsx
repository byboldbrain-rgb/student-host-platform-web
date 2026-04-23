"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
} from "react";

type CaptionToken =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string }
  | { type: "mention"; value: string };

type ExpandableCaptionProps = {
  authorName: string;
  authorVerified?: boolean;
  caption: string;
  className?: string;
  mobileLines?: number;
  desktopLines?: number;
  onOpenHashtag?: (tag: string) => void;
  onOpenMention?: (handle: string) => void;
  onOpenPostDetail?: () => void;
  hashtagHrefBuilder?: (tag: string) => string;
  mentionHrefBuilder?: (handle: string) => string;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function tokenizeCaption(input: string): CaptionToken[] {
  const regex = /([#@][\p{L}\p{N}_]+)/gu;
  const result: CaptionToken[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const token = match[0];
    const start = match.index;

    if (start > lastIndex) {
      result.push({
        type: "text",
        value: input.slice(lastIndex, start),
      });
    }

    if (token.startsWith("#")) {
      result.push({
        type: "hashtag",
        value: token.slice(1),
      });
    } else {
      result.push({
        type: "mention",
        value: token.slice(1),
      });
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < input.length) {
    result.push({
      type: "text",
      value: input.slice(lastIndex),
    });
  }

  return result;
}

export default function ExpandableCaption({
  authorName,
  authorVerified = false,
  caption,
  className,
  mobileLines = 2,
  desktopLines = 3,
  onOpenHashtag,
  onOpenMention,
  onOpenPostDetail,
  hashtagHrefBuilder,
  mentionHrefBuilder,
}: ExpandableCaptionProps) {
  const textRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const tokens = useMemo(() => tokenizeCaption(caption), [caption]);
  const effectiveLines = isDesktop ? desktopLines : mobileLines;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const update = () => {
      setIsDesktop(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  const measureOverflow = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const previousClamp = node.style.webkitLineClamp;
    const previousOverflow = node.style.overflow;
    const previousDisplay = node.style.display;
    const previousWebkitBoxOrient = node.style.webkitBoxOrient;

    if (!expanded) {
      node.style.display = "-webkit-box";
      node.style.webkitBoxOrient = "vertical";
      node.style.webkitLineClamp = String(effectiveLines);
      node.style.overflow = "hidden";
    } else {
      node.style.webkitLineClamp = "unset";
      node.style.overflow = "visible";
      node.style.display = "block";
    }

    const lineHeight = parseFloat(window.getComputedStyle(node).lineHeight);
    const collapsedHeight = lineHeight * effectiveLines;
    const fullHeight = node.scrollHeight;

    if (!expanded) {
      setHasOverflow(fullHeight > collapsedHeight + 1);
    } else {
      setHasOverflow(true);
    }

    node.style.webkitLineClamp = previousClamp;
    node.style.overflow = previousOverflow;
    node.style.display = previousDisplay;
    node.style.webkitBoxOrient = previousWebkitBoxOrient;
  }, [effectiveLines, expanded]);

  useIsomorphicLayoutEffect(() => {
    measureOverflow();

    const observer = new ResizeObserver(() => {
      measureOverflow();
    });

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [caption, effectiveLines, expanded, measureOverflow] as DependencyList);

  const handleExpand = useCallback(() => {
    setExpanded(true);

    if (onOpenPostDetail && caption.length > 280) {
      onOpenPostDetail();
    }
  }, [caption.length, onOpenPostDetail]);

  return (
    <div
      className={cx(
        "text-[14px] leading-5 text-neutral-900 dark:text-neutral-100",
        className
      )}
    >
      <div
        ref={textRef}
        className={cx(!expanded && "overflow-hidden")}
        style={
          !expanded
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: effectiveLines,
              }
            : undefined
        }
      >
        <span className="mr-1 inline-flex items-center gap-1 align-middle font-semibold">
          <span>{authorName}</span>
          {authorVerified ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
          ) : null}
        </span>

        {tokens.map((token, index) => {
          if (token.type === "text") {
            return <span key={`${token.type}-${index}`}>{token.value}</span>;
          }

          if (token.type === "hashtag") {
            const label = `#${token.value}`;

            if (hashtagHrefBuilder) {
              return (
                <Link
                  key={`${token.type}-${index}`}
                  href={hashtagHrefBuilder(token.value)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {label}
                </Link>
              );
            }

            return (
              <button
                key={`${token.type}-${index}`}
                type="button"
                onClick={() => onOpenHashtag?.(token.value)}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {label}
              </button>
            );
          }

          const label = `@${token.value}`;

          if (mentionHrefBuilder) {
            return (
              <Link
                key={`${token.type}-${index}`}
                href={mentionHrefBuilder(token.value)}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {label}
              </Link>
            );
          }

          return (
            <button
              key={`${token.type}-${index}`}
              type="button"
              onClick={() => onOpenMention?.(token.value)}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {label}
            </button>
          );
        })}
      </div>

      {!expanded && hasOverflow ? (
        <button
          type="button"
          onClick={handleExpand}
          className="mt-1 text-[14px] font-medium text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          more
        </button>
      ) : null}
    </div>
  );
}