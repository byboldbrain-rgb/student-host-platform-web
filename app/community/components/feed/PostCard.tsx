"use client";

import { useEffect, useMemo, useState } from "react";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostActions from "./PostActions";
import EngagementSummary from "./EngagementSummary";
import ExpandableCaption from "./ExpandableCaption";
import type {
  FeedMetrics,
  FeedPost,
  PostAuthorActionPayload,
  PostCommentActionPayload,
  PostDetailActionPayload,
  PostHashtagActionPayload,
  PostLikeChangePayload,
  PostMediaActionPayload,
  PostMenuActionPayload,
  PostMentionActionPayload,
  PostSaveChangePayload,
  PostShareActionPayload,
} from "./types";

type PostCardProps = {
  post: FeedPost;
  priority?: boolean;
  showDivider?: boolean;
  className?: string;
  onLikeChange?: (payload: PostLikeChangePayload) => void | Promise<void>;
  onSaveChange?: (payload: PostSaveChangePayload) => void | Promise<void>;
  onComment?: (payload: PostCommentActionPayload) => void;
  onShare?: (payload: PostShareActionPayload) => void;
  onOpenAuthor?: (payload: PostAuthorActionPayload) => void;
  onOpenMenu?: (payload: PostMenuActionPayload) => void;
  onOpenMedia?: (payload: PostMediaActionPayload) => void;
  onOpenHashtag?: (payload: PostHashtagActionPayload) => void;
  onOpenMention?: (payload: PostMentionActionPayload) => void;
  onOpenPostDetail?: (payload: PostDetailActionPayload) => void;
  hashtagHrefBuilder?: (tag: string) => string;
  mentionHrefBuilder?: (handle: string) => string;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function adjustCount(current: number, increase: boolean) {
  if (increase) return current + 1;
  return Math.max(0, current - 1);
}

export default function PostCard({
  post,
  priority = false,
  showDivider = true,
  className,
  onLikeChange,
  onSaveChange,
  onComment,
  onShare,
  onOpenAuthor,
  onOpenMenu,
  onOpenMedia,
  onOpenHashtag,
  onOpenMention,
  onOpenPostDetail,
  hashtagHrefBuilder,
  mentionHrefBuilder,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.viewerState.liked);
  const [saved, setSaved] = useState(post.viewerState.saved);
  const [likesCount, setLikesCount] = useState(post.metrics.likes);
  const [savePending, setSavePending] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"success" | "error" | null>(null);

  const hasVideo = post.media.some((item) => item.type === "video");

  useEffect(() => {
    setLiked(post.viewerState.liked);
    setSaved(post.viewerState.saved);
    setLikesCount(post.metrics.likes);
    setLikePending(false);
    setSavePending(false);
    setShareFeedback(null);
  }, [post.id, post.metrics.likes, post.viewerState.liked, post.viewerState.saved]);

  useEffect(() => {
    if (!shareFeedback) return;

    const timer = window.setTimeout(() => {
      setShareFeedback(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  const metrics: FeedMetrics = useMemo(
    () => ({
      ...post.metrics,
      likes: likesCount,
    }),
    [likesCount, post.metrics]
  );

  const handleLike = async () => {
    if (likePending) return;

    const nextLiked = !liked;

    setLiked(nextLiked);
    setLikesCount((prev) => adjustCount(prev, nextLiked));
    setLikePending(true);

    try {
      await onLikeChange?.({
        postId: post.id,
        liked: nextLiked,
      });
    } catch {
      setLiked(!nextLiked);
      setLikesCount((prev) => adjustCount(prev, !nextLiked));
    } finally {
      setLikePending(false);
    }
  };

  const handleSave = async () => {
    if (savePending) return;

    const nextSaved = !saved;

    setSaved(nextSaved);
    setSavePending(true);

    try {
      await onSaveChange?.({
        postId: post.id,
        saved: nextSaved,
      });
    } catch {
      setSaved(!nextSaved);
    } finally {
      setSavePending(false);
    }
  };

  const handleComment = () => {
    onComment?.({
      postId: post.id,
    });
  };

  const handleShare = async () => {
    const shareLink = post.shareUrl?.trim();

    onShare?.({
      postId: post.id,
    });

    if (!shareLink) {
      setShareFeedback("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setShareFeedback("success");
    } catch {
      setShareFeedback("error");
    }
  };

  const handleOpenAuthor = (authorId: FeedPost["author"]["id"]) => {
    onOpenAuthor?.({
      postId: post.id,
      authorId,
    });
  };

  const handleOpenMenu = () => {
    onOpenMenu?.({
      postId: post.id,
    });
  };

  const handleOpenMedia = (index: number) => {
    onOpenMedia?.({
      postId: post.id,
      index,
    });
  };

  const handleOpenHashtag = (tag: string) => {
    onOpenHashtag?.({
      postId: post.id,
      tag,
    });
  };

  const handleOpenMention = (handle: string) => {
    onOpenMention?.({
      postId: post.id,
      handle,
    });
  };

  const handleOpenPostDetail = () => {
    onOpenPostDetail?.({
      postId: post.id,
    });
  };

  return (
    <article
      className={cx("px-4 py-3", className)}
      aria-label={`Post by ${post.author.name}`}
      data-post-id={post.id}
    >
      <div
        className={cx(
          "mx-auto w-full max-w-[300px]",
          showDivider && "border-b border-black/10 pb-4 dark:border-white/10"
        )}
      >
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          onOpenAuthor={handleOpenAuthor}
          onOpenMenu={handleOpenMenu}
        />

        <PostMedia
          media={post.media}
          altFallback={`${post.author.name} post media`}
          priority={priority}
          aspectRatio="instagram"
          className={cx("mx-auto w-full", hasVideo && "max-w-[420px]")}
          onOpenMedia={handleOpenMedia}
        />

        <div className="mt-3">
          <PostActions
            liked={liked}
            saved={saved}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={handleSave}
            isLikePending={likePending}
            isSavePending={savePending}
          />
        </div>

        {shareFeedback ? (
          <div className="mt-2">
            <div
              className={cx(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm",
                shareFeedback === "success"
                  ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
              )}
              role="status"
              aria-live="polite"
            >
              {shareFeedback === "success"
                ? "Link copied"
                : "No share link available"}
            </div>
          </div>
        ) : null}

        <div className="mt-2">
          <EngagementSummary metrics={metrics} media={post.media} />
        </div>

        <div className="mt-1.5">
          <ExpandableCaption
            authorName={post.author.name}
            authorVerified={post.author.verified}
            caption={post.caption}
            onOpenHashtag={handleOpenHashtag}
            onOpenMention={handleOpenMention}
            onOpenPostDetail={handleOpenPostDetail}
            hashtagHrefBuilder={hashtagHrefBuilder}
            mentionHrefBuilder={mentionHrefBuilder}
          />
        </div>
      </div>
    </article>
  );
}