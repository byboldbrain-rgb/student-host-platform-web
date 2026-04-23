import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MoreHorizontal } from "lucide-react";
import type { FeedAuthor } from "./types";

type PostHeaderProps = {
  author: FeedAuthor;
  createdAt: string;
  onOpenAuthor?: (authorId: FeedAuthor["id"]) => void;
  onOpenMenu?: () => void;
  timeLabel?: string;
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.max(1, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function PostHeader({
  author,
  createdAt,
  onOpenAuthor,
  onOpenMenu,
  timeLabel,
}: PostHeaderProps) {
  const resolvedTimeLabel = timeLabel ?? formatRelativeTime(createdAt);

  const handleAuthorClick = () => {
    onOpenAuthor?.(author.id);
  };

  return (
    <header className="mb-3 flex items-center justify-between">
      <Link
        href="/properties"
        onClick={handleAuthorClick}
        className="flex min-w-0 items-center gap-3 rounded-full text-left outline-none transition active:scale-[0.99]"
        aria-label={`Open ${author.name} profile`}
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white">
          <Image
            src={author.avatarUrl}
            alt={`${author.name} avatar`}
            fill
            sizes="40px"
            className="object-cover scale-[1.5]"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold leading-5 text-neutral-950 dark:text-neutral-50">
              {author.name}
            </span>

            {author.verified ? (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-blue-500"
                aria-label="Verified account"
              />
            ) : null}
          </div>

          <div className="truncate text-[13px] leading-4 text-neutral-500 dark:text-neutral-400">
            @{author.handle} · {resolvedTimeLabel}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onOpenMenu}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-neutral-600 outline-none transition hover:bg-black/5 active:scale-95 dark:text-neutral-300 dark:hover:bg-white/10"
        aria-label="Open post menu"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </header>
  );
}