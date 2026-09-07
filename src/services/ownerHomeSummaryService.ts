import { supabase, supabaseConfigError } from "@/lib/supabase";
import { getOwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { VenuePlan } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export interface OwnerHomeMetrics {
  profileViews: number;
  directions: number;
  enquiries: number;
  saves: number;
}

export interface OwnerHomeVenue {
  id: string;
  slug: string;
  name: string;
  area: string;
  plan: VenuePlan;
  hasPricing: boolean;
  approvedPhotoCount: number;
}

export interface OwnerHomeSummary {
  venues: OwnerHomeVenue[];
  metrics: OwnerHomeMetrics;
  pendingBookingRequests: number;
  newEnquiries: number;
  oldestPendingBookingAt: string | null;
}

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerHomeSummary(input: { userId: string }): Promise<OwnerHomeSummary> {
  const venues = await getMyClaimedVenues(input.userId);
  if (!venues.length) return emptySummary();

  const venueIds = venues.map((venue) => venue.id);
  const [subscriptions, photoCounts, bookings, enquiries, analytics] = await Promise.all([
    getOwnerVenueSubscriptions(input.userId).catch(() => []),
    getApprovedPhotoCounts(venueIds).catch(() => ({}) as Record<string, number>),
    getPendingBookingRequests(venueIds).catch(() => [] as { createdAt: string }[]),
    getNewEnquiryCount(venueIds).catch(() => 0),
    Promise.all(venues.map((venue) => getOwnerVenueAnalyticsSummary({ userId: input.userId, venueId: venue.id, dateRange: "last_30_days" }).catch(() => null))),
  ]);

  const planByVenueId = Object.fromEntries(subscriptions.map((subscription) => [subscription.venueId, subscription.plan]));

  return {
    venues: venues.map((venue) => ({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      area: venue.area,
      plan: planByVenueId[venue.id] ?? "free",
      hasPricing: hasPricing(venue),
      approvedPhotoCount: photoCounts[venue.id] ?? 0,
    })),
    metrics: analytics.reduce<OwnerHomeMetrics>(
      (totals, summary) => ({
        profileViews: totals.profileViews + (summary?.profileViews ?? 0),
        directions: totals.directions + (summary?.directionsClicks ?? 0),
        enquiries: totals.enquiries + (summary?.enquiries ?? 0),
        saves: totals.saves + (summary?.saves ?? 0),
      }),
      { profileViews: 0, directions: 0, enquiries: 0, saves: 0 },
    ),
    pendingBookingRequests: bookings.length,
    newEnquiries: enquiries,
    oldestPendingBookingAt: bookings.reduce<string | null>((oldest, booking) => (!oldest || booking.createdAt < oldest ? booking.createdAt : oldest), null),
  };
}

function hasPricing(venue: Venue) {
  return typeof venue.priceFrom === "number" && venue.priceFrom > 0;
}

async function getApprovedPhotoCounts(venueIds: string[]): Promise<Record<string, number>> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_media").select("venue_id").in("venue_id", venueIds).eq("review_status", "approved");
  if (error) throw new Error(`Could not load venue photos: ${error.message}`);
  return ((data ?? []) as { venue_id: string }[]).reduce<Record<string, number>>((counts, row) => {
    counts[row.venue_id] = (counts[row.venue_id] ?? 0) + 1;
    return counts;
  }, {});
}

async function getPendingBookingRequests(venueIds: string[]): Promise<{ createdAt: string }[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("booking_requests").select("created_at").in("venue_id", venueIds).eq("status", "pending");
  if (error) throw new Error(`Could not load booking requests: ${error.message}`);
  return ((data ?? []) as { created_at: string }[]).map((row) => ({ createdAt: row.created_at }));
}

async function getNewEnquiryCount(venueIds: string[]): Promise<number> {
  const client = ensureSupabase();
  const { count, error } = await client.from("venue_enquiries").select("id", { count: "exact", head: true }).in("venue_id", venueIds).eq("status", "new");
  if (error) throw new Error(`Could not load enquiries: ${error.message}`);
  return count ?? 0;
}

export async function getOwnerNeedsReplyCount(input: { userId: string }): Promise<number> {
  const venues = await getMyClaimedVenues(input.userId);
  if (!venues.length) return 0;
  const venueIds = venues.map((venue) => venue.id);
  const [bookings, enquiries] = await Promise.all([getPendingBookingRequests(venueIds), getNewEnquiryCount(venueIds)]);
  return bookings.length + enquiries;
}

function emptySummary(): OwnerHomeSummary {
  return {
    venues: [],
    metrics: { profileViews: 0, directions: 0, enquiries: 0, saves: 0 },
    pendingBookingRequests: 0,
    newEnquiries: 0,
    oldestPendingBookingAt: null,
  };
}
