'use client'

import type { HTMLAttributes, VideoHTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

type AnimatedVideoIconProps = {
  poster: string
  mp4Src: string
  webmSrc: string
  size?: number
  className?: string
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, 'poster'>

export function AnimatedVideoIcon({
  poster,
  mp4Src,
  webmSrc,
  size = 40,
  className,
  ...props
}: AnimatedVideoIconProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleMouseEnter = () => {
    const video = videoRef.current
    if (!video) return

    try {
      video.currentTime = 0
      void video.play()
    } catch {}
  }

  const handleMouseLeave = () => {
    const video = videoRef.current
    if (!video) return

    try {
      video.pause()
      video.currentTime = 0
    } catch {}
  }

  return (
    <video
      ref={videoRef}
      className={cn('block object-contain', className)}
      playsInline
      muted
      preload="auto"
      poster={poster}
      width={size}
      height={size}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <source src={mp4Src} type='video/mp4; codecs="hvc1"' />
      <source src={webmSrc} type="video/webm" />
    </video>
  )
}

export function HomesAnimatedIcon({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <AnimatedVideoIcon
      size={size}
      className={className}
      poster="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240"
      mp4Src="https://a0.muscache.com/videos/search-bar-icons/hevc/house-twirl-selected.mov"
      webmSrc="https://a0.muscache.com/videos/search-bar-icons/webm/house-twirl-selected.webm"
      aria-label="Homes icon"
    />
  )
}

export function ServicesAnimatedIcon({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <AnimatedVideoIcon
      size={size}
      className={className}
      poster="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/3d67e9a9-520a-49ee-b439-7b3a75ea814d.png?im_w=240"
      mp4Src="https://a0.muscache.com/videos/search-bar-icons/hevc/consierge-twirl.mov"
      webmSrc="https://a0.muscache.com/videos/search-bar-icons/webm/consierge-twirl.webm"
      aria-label="Services icon"
    />
  )
}

export interface GraduationCapIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface GraduationCapIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const CAP_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    y: 0,
  },
  animate: {
    y: [0, -2, 0],
    rotate: [0, -2, 2, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
}

const TASSEL_VARIANTS: Variants = {
  normal: {
    rotate: 0,
  },
  animate: {
    rotate: [0, 15, -10, 5, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      delay: 0.1,
    },
  },
}

export const GraduationCapIcon = forwardRef<
  GraduationCapIconHandle,
  GraduationCapIconProps
>(({ onMouseEnter, onMouseLeave, className, size = 34, ...props }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true
    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal'),
    }
  })

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e)
      } else {
        void controls.start('animate')
      }
    },
    [controls, onMouseEnter]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e)
      } else {
        void controls.start('normal')
      }
    },
    [controls, onMouseLeave]
  )

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <svg
        fill="none"
        height={size}
        width={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g
          animate={controls}
          initial="normal"
          variants={CAP_VARIANTS}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
          <motion.path
            d="M22 10v6"
            variants={TASSEL_VARIANTS}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'top center',
            }}
          />
        </motion.g>
      </svg>
    </div>
  )
})

GraduationCapIcon.displayName = 'GraduationCapIcon'

export function CareerAnimatedIcon({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <AnimatedVideoIcon
      size={size}
      className={className}
      poster="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/e47ab655-027b-4679-b2e6-df1c99a5c33d.png?im_w=240"
      mp4Src="https://a0.muscache.com/videos/search-bar-icons/hevc/balloon-twirl.mov"
      webmSrc="https://a0.muscache.com/videos/search-bar-icons/webm/balloon-twirl.webm"
      aria-label="Career icon"
    />
  )
}

