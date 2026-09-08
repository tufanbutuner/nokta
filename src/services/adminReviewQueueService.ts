import { supabase, supabaseConfigError } from "@/lib/supabase";
import { toReviewQueueDecision } from "@/lib/adminReviewQueueLabels";
import { getVenueUpdateDiffLabels } from "@/lib/venueUpdateDiff";
import { getAdminVenueUpdateRequests } from "@/services/adminVenueUpdateRequestService";
import { getAdminVenueMedia } from "@/services/adminVenueMediaReviewService";
import type { ReviewQueueCounts, ReviewQueueItem } from "@/types/adminReviewQueue";
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
