export type ReviewQueueType = "updates" | "media" | "claims" | "suggestions" | "reviews" | "promos";

export type ReviewQueueDecision = "pending" | "approved" | "rejected" | "settled";

export type ReviewQueueSort = "oldest" | "newest";

/**
 * The shared shape every queue maps into. Each queue keeps its own service,
 * mappers and validation — this is only what the list row and the shared
 * header of the detail panel need.
 */
export interface ReviewQueueItem {
  id: string;
  type: ReviewQueueType;
  venueId: string | null;
  venueName: string;
  /** What changed / what was submitted, one line. */
  summary: string;
  status: string;
  decision: ReviewQueueDecision;
  /** Extra qualifier shown beside the status pill, e.g. "Not applied yet". */
  qualifier: string | null;
  submittedBy: string | null;
  createdAt: string;
  ownerNote: string | null;
  adminNote: string | null;
}

export interface ReviewQueueCounts {
  updates: number;
  media: number;
  claims: number;
  suggestions: number;
  reviews: number;
  promos: number;
}

export type PhotoDecision = "approve" | "reject";
