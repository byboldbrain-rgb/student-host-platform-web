"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { Heart, Send } from "lucide-react";

type PostActionsProps = {
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  isLikePending?: boolean;
  isSavePending?: boolean;
  className?: string;
};

type ActionButtonProps = {
  label: string;
  active?: boolean;
  pending?: boolean;
  onClick: () => void;
  icon: ReactNode;
  activeIcon?: ReactNode;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function ActionButton({
  label,
  active = false,
  pending = false,
  onClick,
  icon,
  activeIcon,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={pending}
      className={cx(
        "grid h-10 w-10 place-items-center rounded-full outline-none transition",
        "active:scale-95 disabled:pointer-events-none disabled:opacity-60",
        "hover:bg-black/5 dark:hover:bg-white/10",
        "focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
      )}
    >
      <span
        className={cx(
          "transition-transform duration-200",
          active ? "scale-110" : "scale-100"
        )}
      >
        {active && activeIcon ? activeIcon : icon}
      </span>
    </button>
  );
}

export default function PostActions({
  liked,
  saved,
  onLike,
  onComment,
  onShare,
  onSave,
  isLikePending = false,
  isSavePending = false,
  className,
}: PostActionsProps) {
  const handleLike = useCallback(() => {
    onLike();
  }, [onLike]);

  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  return (
    <div
      className={cx("flex items-center justify-between", className)}
      aria-label="Post actions"
    >
      <div className="flex items-center gap-0.5">
        <ActionButton
          label={liked ? "Unlike post" : "Like post"}
          active={liked}
          pending={isLikePending}
          onClick={handleLike}
          icon={
            <Heart className="h-[22px] w-[22px] text-neutral-900 dark:text-neutral-100" />
          }
          activeIcon={
            <Heart className="h-[22px] w-[22px] fill-red-500 text-red-500" />
          }
        />

        <ActionButton
          label="Share post"
          onClick={handleShare}
          icon={
            <Send className="h-[22px] w-[22px] text-neutral-900 dark:text-neutral-100" />
          }
        />
      </div>
    </div>
  );
}