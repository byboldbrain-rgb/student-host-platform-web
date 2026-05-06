"use client";

import { useEffect, useRef } from "react";

type PlayableVideo = HTMLVideoElement & {
  dataset: DOMStringMap & {
    communityAutoplayReady?: string;
    communityManualPaused?: string;
  };
};

export default function CommunityFeedVideoAutoplay() {
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const userInteractedRef = useRef(false);
  const lastToggleAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const feedRoot = document.querySelector<HTMLElement>(
      "[data-community-feed]"
    );

    if (!feedRoot) return;

    const getVideos = () =>
      Array.from(feedRoot.querySelectorAll<HTMLVideoElement>("video"));

    const prepareVideo = (video: PlayableVideo) => {
      if (video.dataset.communityAutoplayReady === "true") return;

      video.dataset.communityAutoplayReady = "true";
      video.playsInline = true;
      video.preload = "metadata";
      video.loop = true;
      video.volume = 1;

      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("preload", "metadata");

      video.controls = false;
      video.removeAttribute("controls");
    };

    const pauseVideo = (video: HTMLVideoElement) => {
      try {
        video.pause();
      } catch {
        // Ignore pause errors.
      }
    };

    const pauseOtherVideos = (currentVideo: HTMLVideoElement) => {
      getVideos().forEach((video) => {
        if (video !== currentVideo) {
          pauseVideo(video);
        }
      });
    };

    const pauseAllVideos = () => {
      getVideos().forEach((video) => {
        pauseVideo(video);
      });
    };

    const playVideo = async (video: PlayableVideo) => {
      if (video.dataset.communityManualPaused === "true") {
        pauseVideo(video);
        return;
      }

      activeVideoRef.current = video;
      pauseOtherVideos(video);

      video.volume = 1;
      video.muted = false;

      try {
        await video.play();
      } catch {
        try {
          video.muted = true;
          await video.play();
        } catch {
          // Some browsers still block playback until a real user gesture.
        }
      }
    };

    const unlockSound = async () => {
      userInteractedRef.current = true;

      const activeVideo = activeVideoRef.current as PlayableVideo | null;

      if (!activeVideo) return;

      if (activeVideo.dataset.communityManualPaused === "true") {
        pauseVideo(activeVideo);
        return;
      }

      activeVideo.volume = 1;
      activeVideo.muted = false;

      try {
        await activeVideo.play();
      } catch {
        // Browser may still require direct tap on some devices.
      }
    };

    const getVideoFromPoint = (clientX: number, clientY: number) => {
      return (
        getVideos().find((video) => {
          const rect = video.getBoundingClientRect();

          return (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          );
        }) || null
      );
    };

    const toggleVideo = async (video: PlayableVideo) => {
      const now = Date.now();

      if (now - lastToggleAtRef.current < 350) return;

      lastToggleAtRef.current = now;
      userInteractedRef.current = true;

      if (video.paused || video.dataset.communityManualPaused === "true") {
        delete video.dataset.communityManualPaused;

        activeVideoRef.current = video;
        pauseOtherVideos(video);

        video.volume = 1;
        video.muted = false;

        try {
          await video.play();
        } catch {
          try {
            video.muted = true;
            await video.play();
          } catch {
            // Ignore.
          }
        }
      } else {
        video.dataset.communityManualPaused = "true";
        pauseVideo(video);
      }
    };

    const handleFeedPointerUp = (event: PointerEvent) => {
      const video = getVideoFromPoint(
        event.clientX,
        event.clientY
      ) as PlayableVideo | null;

      if (!video) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      toggleVideo(video);
    };

    const handleFeedClick = (event: MouseEvent) => {
      const video = getVideoFromPoint(
        event.clientX,
        event.clientY
      ) as PlayableVideo | null;

      if (!video) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const videos = getVideos();

        entries.forEach((entry) => {
          const video = entry.target as PlayableVideo;

          /**
           * لو الفيديو خرج من الشاشة، يتوقف.
           * وكمان نمسح manual pause عشان لما ترجعله بعدين يشتغل عادي.
           */
          if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
            pauseVideo(video);
            delete video.dataset.communityManualPaused;
          }
        });

        const visibleEntries = entries
          .filter((entry) => {
            const video = entry.target as PlayableVideo;

            return (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.55 &&
              video.dataset.communityManualPaused !== "true"
            );
          })
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const mostVisibleEntry = visibleEntries[0];

        if (!mostVisibleEntry) {
          const hasAnyVisibleVideo = videos.some((video) => {
            const rect = video.getBoundingClientRect();
            const visibleHeight =
              Math.min(rect.bottom, window.innerHeight) -
              Math.max(rect.top, 72);

            return visibleHeight / Math.max(rect.height, 1) >= 0.55;
          });

          if (!hasAnyVisibleVideo) {
            activeVideoRef.current = null;
          }

          return;
        }

        const video = mostVisibleEntry.target as PlayableVideo;

        playVideo(video);
      },
      {
        root: null,
        threshold: [0, 0.15, 0.2, 0.35, 0.5, 0.55, 0.65, 0.8, 1],
      }
    );

    const observeVideos = () => {
      getVideos().forEach((video) => {
        prepareVideo(video as PlayableVideo);
        observer.observe(video);
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAllVideos();
        activeVideoRef.current = null;
      }
    };

    observeVideos();

    const mutationObserver = new MutationObserver(() => {
      observeVideos();
    });

    mutationObserver.observe(feedRoot, {
      childList: true,
      subtree: true,
    });

    /**
     * دي نفس طريقة الكود القديم اللي كانت بتخلي الصوت يطلع مع الـ scroll.
     */
    window.addEventListener("click", unlockSound, { passive: true });
    window.addEventListener("touchstart", unlockSound, { passive: true });
    window.addEventListener("scroll", unlockSound, { passive: true });
    window.addEventListener("keydown", unlockSound);

    /**
     * دي مسؤولة عن إن ضغطة واحدة على الفيديو تعمل pause/play.
     * بنستخدم capture عشان نغلب أي overlay فوق الفيديو داخل PostCard.
     */
    feedRoot.addEventListener("pointerup", handleFeedPointerUp, true);
    feedRoot.addEventListener("click", handleFeedClick, true);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();

      window.removeEventListener("click", unlockSound);
      window.removeEventListener("touchstart", unlockSound);
      window.removeEventListener("scroll", unlockSound);
      window.removeEventListener("keydown", unlockSound);

      feedRoot.removeEventListener("pointerup", handleFeedPointerUp, true);
      feedRoot.removeEventListener("click", handleFeedClick, true);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}