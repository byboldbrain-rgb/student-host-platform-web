export type FeedMediaType = "image" | "video";

export type FeedMediaItem = {
  id: string | number;
  type: FeedMediaType;
  src: string;
  alt?: string | null;
  poster?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  blurDataUrl?: string | null;
};

export type FeedAuthor = {
  id: string | number;
  name: string;
  handle: string;
  avatarUrl: string;
  verified?: boolean;
};

export type FeedMetrics = {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  saves?: number;
};

export type FeedViewerState = {
  liked: boolean;
  saved: boolean;
  followingAuthor?: boolean;
};

export type FeedPost = {
  id: string | number;
  author: FeedAuthor;
  createdAt: string;
  caption: string;
  media: FeedMediaItem[];
  metrics: FeedMetrics;
  viewerState: FeedViewerState;
  shareUrl?: string | null;
};

export type PostLikeChangePayload = {
  postId: FeedPost["id"];
  liked: boolean;
};

export type PostSaveChangePayload = {
  postId: FeedPost["id"];
  saved: boolean;
};

export type PostCommentActionPayload = {
  postId: FeedPost["id"];
};

export type PostShareActionPayload = {
  postId: FeedPost["id"];
};

export type PostAuthorActionPayload = {
  postId: FeedPost["id"];
  authorId: FeedAuthor["id"];
};

export type PostMenuActionPayload = {
  postId: FeedPost["id"];
};

export type PostMediaActionPayload = {
  postId: FeedPost["id"];
  index: number;
};

export type PostHashtagActionPayload = {
  postId: FeedPost["id"];
  tag: string;
};

export type PostMentionActionPayload = {
  postId: FeedPost["id"];
  handle: string;
};

export type PostDetailActionPayload = {
  postId: FeedPost["id"];
};