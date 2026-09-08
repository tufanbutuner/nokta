import { supabase, supabaseConfigError } from "@/lib/supabase";
import { toReviewQueueDecision } from "@/lib/adminReviewQueueLabels";
import { getVenueUpdateDiffLabels } from "@/lib/venueUpdateDiff";
import { getAdminVenueUpdateRequests } from "@/services/adminVenueUpdateRequestService";
import { getAdminVenueMedia } from "@/services/adminVenueMediaReviewService";
import { getAdminVenueClaimRequests } from "@/services/adminVenueClaimService";
import { getAdminVenueSuggestions } from "@/services/adminVenueSuggestionService";
import { getAdminReviews } from "@/services/adminReviewService";
import { getAdminPromotionRequests } from "@/services/adminPromotionRequestService";
import type { ReviewQueueCounts, ReviewQueueItem } from "@/types/adminReviewQueue";
import type { VenueClaimRequest } from "@/types/venueClaims";
import type { VenueSuggestion } from "@/types/venueSuggestions";
import type { VenueReview } from "@/types/reviews";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";
import type { VenueMedia } from "@/types/venueMedia";
import type { VenueUpdateRequest } from "@/types/venueUpdateRequests";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export interface VenueSummary {
  id: string;
  name: string;
  area: string;
  city: string;
  slug: string;
  isClaimed: boolean;
}

export async function getAdminUserEmails(userIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return {};

  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_admin_user_emails", { user_ids: unique });
  if (error) throw new Error(`Could not load submitter emails: ${error.message}`);

  return Object.fromEntries(
    ((data ?? []) as { user_id: string; email: string }[]).map((row) => [row.user_id, row.email]),
  );
}

/** One lookup for every venue referenced by a queue, rather than per row. */
export async function getVenueSummaries(venueIds: string[]): Promise<Record<string, VenueSummary>> {
  const unique = [...new Set(venueIds.filter(Boolean))];
  if (!unique.length) return {};

  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("id, name, area, city, slug, is_claimed").in("id", unique);
  if (error) throw new Error(`Could not load venues: ${error.message}`);

  return Object.fromEntries(
    ((data ?? []) as { id: string; name: string; area: string; city: string; slug: string; is_claimed: boolean }[]).map((row) => [
      row.id,
      { id: row.id, name: row.name, area: row.area, city: row.city, slug: row.slug, isClaimed: row.is_claimed },
    ]),
  );
}

export interface UpdatesQueueResult {
  items: ReviewQueueItem[];
  requestsById: Record<string, VenueUpdateRequest>;
  venues: Record<string, VenueSummary>;
}

export async function getUpdatesQueue(): Promise<UpdatesQueueResult> {
  const requests = await getAdminVenueUpdateRequests();
  const venues = await getVenueSummaries(requests.map((request) => request.venueId));

  return {
    items: requests.map((request) => {
      const labels = getVenueUpdateDiffLabels(request);
      const venue = venues[request.venueId];
      return {
        id: request.id,
        type: "updates" as const,
        venueId: request.venueId,
        venueName: venue?.name ?? request.venueId,
        summary: labels.length ? labels.join(", ") : "No field changes",
        status: request.status,
        decision: toReviewQueueDecision(request.status),
        qualifier: getUpdateQualifier(request, venue),
        submittedBy: request.submittedBy,
        createdAt: request.createdAt,
        ownerNote: request.requestNotes,
        adminNote: request.adminNotes,
      };
    }),
    requestsById: Object.fromEntries(requests.map((request) => [request.id, request])),
    venues,
  };
}

function getUpdateQualifier(request: VenueUpdateRequest, venue?: VenueSummary): string | null {
  if (request.status === "approved") return "Not applied yet";
  if (request.status === "cancelled") return "Owner withdrew";
  if (!venue) return null;
  return [venue.area, venue.city].filter(Boolean).join(", ");
}

export interface MediaQueueResult {
  /** One row per venue: photo review is decided per venue, not per photo. */
  items: ReviewQueueItem[];
  mediaByVenue: Record<string, VenueMedia[]>;
  venues: Record<string, VenueSummary>;
}

export async function getMediaQueue(): Promise<MediaQueueResult> {
  const media = await getAdminVenueMedia("pending");
  const venues = await getVenueSummaries(media.map((item) => item.venueId));

  const mediaByVenue = media.reduce<Record<string, VenueMedia[]>>((groups, item) => {
    groups[item.venueId] = [...(groups[item.venueId] ?? []), item];
    return groups;
  }, {});

  return {
    items: Object.entries(mediaByVenue).map(([venueId, items]) => {
      const venue = venues[venueId];
      const oldest = items.reduce((earliest, item) => (item.createdAt < earliest ? item.createdAt : earliest), items[0].createdAt);
      return {
        id: venueId,
        type: "media" as const,
        venueId,
        venueName: venue?.name ?? venueId,
        summary: `${items.length} photo${items.length === 1 ? "" : "s"} awaiting review`,
        status: "pending",
        decision: "pending" as const,
        qualifier: venue ? [venue.area, venue.city].filter(Boolean).join(", ") : null,
        submittedBy: items[0].uploadedBy,
        createdAt: oldest,
        ownerNote: items.find((item) => item.caption)?.caption ?? null,
        adminNote: null,
      };
    }),
    mediaByVenue,
    venues,
  };
}

export interface ClaimsQueueResult {
  items: ReviewQueueItem[];
  claimsById: Record<string, VenueClaimRequest>;
  venues: Record<string, VenueSummary>;
}

export async function getClaimsQueue(): Promise<ClaimsQueueResult> {
  const claims = await getAdminVenueClaimRequests();
  const venues = await getVenueSummaries(claims.map((claim) => claim.venueId));

  return {
    items: claims.map((claim) => {
      const venue = venues[claim.venueId];
      const role = claim.claimantRole === "marketing" ? "marketing / agency" : claim.claimantRole;
      return {
        id: claim.id,
        type: "claims" as const,
        venueId: claim.venueId,
        venueName: venue?.name ?? claim.venueId,
        summary: `${claim.claimantName} · ${role}`,
        status: claim.status,
        decision: toReviewQueueDecision(claim.status),
        qualifier: claim.status === "cancelled" ? "Claimant withdrew" : venue ? [venue.area, venue.city].filter(Boolean).join(", ") : null,
        submittedBy: claim.submittedBy,
        createdAt: claim.createdAt,
        ownerNote: claim.proofNotes,
        adminNote: claim.adminNotes,
      };
    }),
    claimsById: Object.fromEntries(claims.map((claim) => [claim.id, claim])),
    venues,
  };
}

export interface SuggestionsQueueResult {
  items: ReviewQueueItem[];
  suggestionsById: Record<string, VenueSuggestion>;
}

export async function getSuggestionsQueue(): Promise<SuggestionsQueueResult> {
  const suggestions = await getAdminVenueSuggestions();

  return {
    items: suggestions.map((suggestion) => ({
      id: suggestion.id,
      type: "suggestions" as const,
      venueId: null,
      venueName: suggestion.venueName,
      summary: [suggestion.primaryCategory.replace(/_/g, " "), suggestion.area, suggestion.city].filter(Boolean).join(" · "),
      status: suggestion.status,
      decision: toReviewQueueDecision(suggestion.status),
      qualifier: suggestion.status === "converted" ? "Venue created" : [suggestion.area, suggestion.city].filter(Boolean).join(", ") || null,
      submittedBy: suggestion.submittedBy,
      createdAt: suggestion.createdAt,
      ownerNote: suggestion.notes,
      adminNote: suggestion.adminNotes,
    })),
    suggestionsById: Object.fromEntries(suggestions.map((suggestion) => [suggestion.id, suggestion])),
  };
}

export interface ReviewsQueueResult {
  items: ReviewQueueItem[];
  reviewsById: Record<string, VenueReview>;
  venues: Record<string, VenueSummary>;
}

export async function getReviewsQueue(): Promise<ReviewsQueueResult> {
  const reviews = await getAdminReviews();
  const venues = await getVenueSummaries(reviews.map((review) => review.venueId));

  return {
    items: reviews.map((review) => {
      const venue = venues[review.venueId];
      return {
        id: review.id,
        type: "reviews" as const,
        venueId: review.venueId,
        venueName: venue?.name ?? review.venueId,
        summary: `${review.rating}/5 · ${review.title || review.body}`,
        status: review.status,
        decision: review.status === "flagged" ? "pending" as const : toReviewQueueDecision(review.status),
        qualifier: venue ? [venue.area, venue.city].filter(Boolean).join(", ") : null,
        submittedBy: review.userId,
        createdAt: review.createdAt,
        ownerNote: null,
        adminNote: review.moderationNotes ?? null,
      };
    }),
    reviewsById: Object.fromEntries(reviews.map((review) => [review.id, review])),
    venues,
  };
}

export interface PromosQueueResult {
  items: ReviewQueueItem[];
  promosById: Record<string, OwnerPromotionRequest>;
  venues: Record<string, VenueSummary>;
}

export async function getPromosQueue(): Promise<PromosQueueResult> {
  const promos = await getAdminPromotionRequests();
  const venues = await getVenueSummaries(promos.map((promo) => promo.venueId));

  return {
    items: promos.map((promo) => {
      const venue = venues[promo.venueId];
      const kind = promo.requestType === "promoted_offer" ? "Promoted offer" : "Featured placement";
      return {
        id: promo.id,
        type: "promos" as const,
        venueId: promo.venueId,
        venueName: venue?.name ?? promo.venueId,
        summary: `${kind} · ${promo.title}`,
        status: promo.status,
        decision: toReviewQueueDecision(promo.status),
        qualifier: promo.status === "converted" ? "Draft created" : venue ? [venue.area, venue.city].filter(Boolean).join(", ") : null,
        submittedBy: promo.submittedBy,
        createdAt: promo.createdAt,
        ownerNote: promo.ownerNotes,
        adminNote: promo.adminNotes,
      };
    }),
    promosById: Object.fromEntries(promos.map((promo) => [promo.id, promo])),
    venues,
  };
}

/** Feeds both the chip row and the sidebar badge. */
export async function getReviewQueueCounts(): Promise<ReviewQueueCounts> {
  const client = ensureSupabase();

  const [updates, media, claims, suggestions, reviews, promos] = await Promise.all([
    countPending("venue_update_requests", "status", ["pending"]),
    countPending("venue_media", "review_status", ["pending"]),
    countPending("venue_claim_requests", "status", ["pending"]),
    countPending("venue_suggestions", "status", ["pending"]),
    // Reviews use published/hidden/flagged/deleted — "flagged" is the one
    // awaiting a decision.
    countPending("venue_reviews", "status", ["flagged"]),
    countPending("owner_promotion_requests", "status", ["pending"]),
  ]);

  return { updates, media, claims, suggestions, reviews, promos };

  async function countPending(table: string, column: string, statuses: string[]): Promise<number> {
    const { count, error } = await client.from(table).select("id", { count: "exact", head: true }).in(column, statuses);
    // A table this deployment does not have should not blank the whole chip row.
    if (error) return 0;
    return count ?? 0;
  }
}
