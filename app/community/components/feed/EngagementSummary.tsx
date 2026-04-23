import type { FeedMediaItem, FeedMetrics } from "./types";

type EngagementSummaryProps = {
  metrics: FeedMetrics;
  media: FeedMediaItem[];
  showShares?: boolean;
  className?: string;
};

export default function EngagementSummary({
  metrics,
  media,
  showShares = false,
  className,
}: EngagementSummaryProps) {
  return null;
}