import type { ReviewQueueDecision, ReviewQueueType } from "@/types/adminReviewQueue";

export const REVIEW_QUEUE_TYPES: ReviewQueueType[] = ["updates", "media", "claims", "suggestions", "reviews", "promos"];

const TYPE_LABELS: Record<ReviewQueueType, string> = {
  updates: "Updates",
  media: "Media",
  claims: "Claims",
  suggestions: "Suggestions",
  reviews: "Reviews",
  promos: "Promos",
};

/** Singular, for the type chip on a list row. */
const TYPE_CHIP_LABELS: Record<ReviewQueueType, string> = {
  updates: "Update",
  media: "Media",
  claims: "Claim",
  suggestions: "Suggestion",
  reviews: "Review",
  promos: "Promo",
};

export function formatReviewQueueType(type: ReviewQueueType): string {
  return TYPE_LABELS[type];
}

export function formatReviewQueueChip(type: ReviewQueueType): string {
  return TYPE_CHIP_LABELS[type];
}

export function isReviewQueueType(value: string | null): value is ReviewQueueType {
  return Boolean(value) && REVIEW_QUEUE_TYPES.includes(value as ReviewQueueType);
}

/** Whole days since submission, for the "Pending · 4 days" pill. */
export function getReviewQueueAgeDays(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000)));
}

export function formatReviewQueueAge(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function formatReviewQueueAgeLong(createdAt: string): string {
  const days = getReviewQueueAgeDays(createdAt);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(Math.floor((Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000)), 1);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/** Maps each queue's own status vocabulary onto the shared pill palette. */
export function toReviewQueueDecision(status: string): ReviewQueueDecision {
  const value = status.toLowerCase();
  if (["pending", "new", "submitted", "in_review"].includes(value)) return "pending";
  if (["approved", "converted", "applied", "published", "live"].includes(value)) return "approved";
  if (["rejected", "declined", "spam", "removed"].includes(value)) return "rejected";
  return "settled";
}

export const REJECT_NOTE_CHIPS = ["Hours look right", "Confirm on your website first", "Handle doesn't resolve"];

/** Drawn from media-policy.md; a reason is required to reject a photo. */
export const MEDIA_REJECT_REASONS = [
  "Advert-style or flavour shot",
  "Not your own photo",
  "Too low resolution",
  "Shows people's faces",
];
