"use client";

import { LoaderCircle, Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type FeedVideoProps = {
  src: string;
  poster?: string | null;
  alt?: string | null;
  className?: string;
  isActiveSlide: boolean;
  autoplayVisibilityThreshold?: number;
  nearViewportMargin?: string;
  durationMs?: number | null;
  loopMode?: "auto" | "always" | "never";
};

type PlaybackStore = {
  currentPlayingId: string | null;
  subscribe: (listener: () => void) => () => void;
  requestPlay: (id: string) => void;
  release: (id: string) => void;
  getSnapshot: () => string | null;
};

function createPlaybackStore(): PlaybackStore {
  let currentPlayingId: string | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    currentPlayingId,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    requestPlay(id) {
      if (currentPlayingId === id) return;
      currentPlayingId = id;
      this.currentPlayingId = id;
      emit();
    },
    release(id) {
      if (currentPlayingId !== id) return;
      currentPlayingId = null;
      this.currentPlayingId = null;
      emit();
    },
    getSnapshot() {
      return currentPlayingId;
    },
  };
}

const feedPlaybackStore = createPlaybackStore();

function useCurrentFeedVideoId() {
  return useSyncExternalStore(
    feedPlaybackStore.subscribe,
    feedPlaybackStore.getSnapshot,
    feedPlaybackStore.getSnapshot
  );
}

function formatClockTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const wholeSeconds = Math.floor(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function FeedVideo({
  src,
  poster,
  alt = "Video content",
  className,
  isActiveSlide,
  autoplayVisibilityThreshold = 0.6,
  nearViewportMargin = "300px 0px",
  durationMs,
  loopMode = "auto",
}: FeedVideoProps) {
  const id = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const overlayHideTimeoutRef = useRef<number | null>(null);
  const wasManuallyPausedRef = useRef(false);

  const currentFeedVideoId = useCurrentFeedVideoId();

  const [, setIsNearViewport] = useState(false);
  const [visibleRatio, setVisibleRatio] = useState(0);
  const [shouldLoadSource, setShouldLoadSource] = useState(false);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState(
    durationMs ? durationMs / 1000 : 0
  );

  const [centerIndicator, setCenterIndicator] = useState<"play" | "pause" | null>(null);

  const isVisibleEnough = visibleRatio >= autoplayVisibilityThreshold;
  const isMyTurnToPlay = currentFeedVideoId === id;

  const shouldLoop = useMemo(() => {
    if (loopMode === "always") return true;
    if (loopMode === "never") return false;

    if (!durationMs) return true;
    return durationMs <= 30_000;
  }, [durationMs, loopMode]);

  const canAutoplay =
    shouldLoadSource &&
    isActiveSlide &&
    isVisibleEnough &&
    !wasManuallyPausedRef.current;

  const showCenterIndicatorTemporarily = useCallback((type: "play" | "pause") => {
    setCenterIndicator(type);

    if (overlayHideTimeoutRef.current) {
      window.clearTimeout(overlayHideTimeoutRef.current);
    }

    overlayHideTimeoutRef.current = window.setTimeout(() => {
      setCenterIndicator(null);
    }, 500);
  }, []);

  const pauseVideo = useCallback(() => {
    const node = videoRef.current;
    if (!node) return;

    node.pause();
    setIsPlaying(false);
  }, []);

  const playVideo = useCallback(async () => {
    const node = videoRef.current;
    if (!node) return;

    try {
      node.muted = isMuted;
      await node.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [isMuted]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry?.intersectionRatio ?? 0;

        setVisibleRatio(ratio);

        if (ratio > 0) {
          setShouldLoadSource(true);
        }
      },
      {
        threshold: [0, 0.15, 0.35, autoplayVisibilityThreshold, 1],
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [autoplayVisibilityThreshold]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const near = Boolean(entry?.isIntersecting);
        setIsNearViewport(near);

        if (near) {
          setShouldLoadSource(true);
        }
      },
      {
        rootMargin: nearViewportMargin,
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [nearViewportMargin]);

  useEffect(() => {
    if (isActiveSlide) {
      setShouldLoadSource(true);
    }
  }, [isActiveSlide]);

  useEffect(() => {
    if (canAutoplay) {
      feedPlaybackStore.requestPlay(id);
      return;
    }

    if (currentFeedVideoId === id) {
      feedPlaybackStore.release(id);
    }
  }, [canAutoplay, currentFeedVideoId, id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    node.loop = shouldLoop;
  }, [shouldLoop]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    node.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!isActiveSlide || visibleRatio < 0.35) {
      wasManuallyPausedRef.current = false;
    }
  }, [isActiveSlide, visibleRatio]);

  useEffect(() => {
    if (!shouldLoadSource) return;

    if (!isActiveSlide || !isVisibleEnough || !isMyTurnToPlay) {
      pauseVideo();
      return;
    }

    playVideo();
  }, [
    isActiveSlide,
    isMyTurnToPlay,
    isVisibleEnough,
    pauseVideo,
    playVideo,
    shouldLoadSource,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pauseVideo]);

  useEffect(() => {
    return () => {
      pauseVideo();
      feedPlaybackStore.release(id);

      if (overlayHideTimeoutRef.current) {
        window.clearTimeout(overlayHideTimeoutRef.current);
      }
    };
  }, [id, pauseVideo]);

  const handleTogglePlay = useCallback(async () => {
    const node = videoRef.current;
    if (!node) return;

    if (node.paused) {
      wasManuallyPausedRef.current = false;
      feedPlaybackStore.requestPlay(id);

      setIsMuted(false);
      node.muted = false;

      try {
        await node.play();
        setIsPlaying(true);
        showCenterIndicatorTemporarily("pause");
      } catch {
        node.muted = true;
        setIsMuted(true);

        try {
          await node.play();
          setIsPlaying(true);
          showCenterIndicatorTemporarily("pause");
        } catch {
          setIsPlaying(false);
        }
      }

      return;
    }

    wasManuallyPausedRef.current = true;
    pauseVideo();
    feedPlaybackStore.release(id);
    showCenterIndicatorTemporarily("play");
  }, [id, pauseVideo, showCenterIndicatorTemporarily]);

  const handleSurfaceTap = useCallback(() => {
    handleTogglePlay();
  }, [handleTogglePlay]);

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      const node = videoRef.current;
      if (!node || !resolvedDuration || !Number.isFinite(resolvedDuration)) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
      const nextTime = ratio * resolvedDuration;

      node.currentTime = nextTime;
      setCurrentTime(nextTime);
      setResolvedDuration(node.duration || resolvedDuration);
    },
    [resolvedDuration]
  );

  const handleLoadedMetadata = useCallback(() => {
    const node = videoRef.current;
    if (!node) return;

    setResolvedDuration(node.duration || (durationMs ? durationMs / 1000 : 0));
    setCurrentTime(node.currentTime || 0);
  }, [durationMs]);

  const handleTimeUpdate = useCallback(() => {
    const node = videoRef.current;
    if (!node) return;

    setCurrentTime(node.currentTime);
    setResolvedDuration(node.duration || (durationMs ? durationMs / 1000 : 0));
  }, [durationMs]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
    setIsPlaying(true);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);

    if (!shouldLoop) {
      showCenterIndicatorTemporarily("play");
    }
  }, [shouldLoop, showCenterIndicatorTemporarily]);

  const progressPercent =
    resolvedDuration > 0
      ? Math.min((currentTime / resolvedDuration) * 100, 100)
      : 0;

  return (
    <div
      ref={rootRef}
      className={cx("relative h-full w-full overflow-hidden bg-black", className)}
      onClick={handleSurfaceTap}
      aria-label={alt}
    >
      {shouldLoadSource ? (
        <video
          ref={videoRef}
          playsInline
          preload={isActiveSlide ? "metadata" : "none"}
          poster={poster ?? undefined}
          muted={isMuted}
          loop={shouldLoop}
          className="h-full w-full object-cover"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={handleEnded}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : poster ? (
        <img
          src={poster}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full bg-neutral-900" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

      {isBuffering ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-black/45 p-3 text-white backdrop-blur-sm">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
        </div>
      ) : null}

      {centerIndicator ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-black/40 p-5 text-white backdrop-blur-sm transition-opacity duration-200">
            {centerIndicator === "play" ? (
              <Play className="h-8 w-8 fill-white text-white" />
            ) : (
              <Pause className="h-8 w-8 fill-white text-white" />
            )}
          </div>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-white/90">
          <span>{formatClockTime(currentTime)}</span>
          <span>{formatClockTime(resolvedDuration)}</span>
        </div>

        <button
          type="button"
          onClick={handleSeek}
          className="relative block h-5 w-full touch-manipulation"
          aria-label="Seek video"
        >
          <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </span>

          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.35)]"
            style={{ left: `${progressPercent}%` }}
          />
        </button>
      </div>
    </div>
  );
}