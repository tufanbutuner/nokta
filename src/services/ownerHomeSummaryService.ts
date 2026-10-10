import { supabase, supabaseConfigError } from "@/lib/supabase";
import { getOwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { VenuePlan } from "@/types/subscriptions";
import type { BookingBandUsage } from "@/types/subscriptions";
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
  liveMenuItemCount: number;
  menuLastUpdatedAt: string | null;
}

export interface OwnerHomeSummary {
  venues: OwnerHomeVenue[];
  metrics: OwnerHomeMetrics;
  pendingBookingRequests: number;
  newEnquiries: number;
  oldestPendingBookingAt: string | null;
  bookingBands: BookingBandUsage[];
}

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerHomeSummary(input: { userId: string }): Promise<OwnerHomeSummary> {
  const venues = await getMyClaimedVenues(input.userId);
  if (!venues.length) return emptySummary();

  const venueIds = venues.map((venue) => venue.id);
  const [subscriptions, photoCounts, menuStats, bookings, enquiries, analytics, bookingBands] = await Promise.all([
    getOwnerVenueSubscriptions(input.userId).catch(() => []),
    getApprovedPhotoCounts(venueIds).catch(() => ({}) as Record<string, number>),
    getMenuStats(venueIds).catch(() => ({}) as Record<string, MenuStat>),
    getPendingBookingRequests(venueIds).catch(() => [] as { createdAt: string }[]),
    getNewEnquiryCount(venueIds).catch(() => 0),
    Promise.all(venues.map((venue) => getOwnerVenueAnalyticsSummary({ userId: input.userId, venueId: venue.id, dateRange: "last_30_days" }).catch(() => null))),
    getBookingBandUsage(venueIds).catch(() => []),
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
      liveMenuItemCount: menuStats[venue.id]?.liveCount ?? 0,
      menuLastUpdatedAt: menuStats[venue.id]?.lastUpdatedAt ?? null,
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
    bookingBands,
  };
}

async function getBookingBandUsage(venueIds: string[]): Promise<BookingBandUsage[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("owner_booking_band_usage").select("*").in("venue_id", venueIds);
  if (error) throw new Error(`Could not load booking band usage: ${error.message}`);
  return ((data ?? []) as Array<{ venue_id: string; plan: VenuePlan; accepted_bookings_band: number | null; accepted_bookings: number; period_start: string; period_end: string }>).map((row) => ({
    venueId: row.venue_id,
    plan: row.plan,
    acceptedBookingsBand: row.accepted_bookings_band,
    acceptedBookings: row.accepted_bookings,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }));
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

interface MenuStat {
  liveCount: number;
  lastUpdatedAt: string | null;
}

async function getMenuStats(venueIds: string[]): Promise<Record<string, MenuStat>> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_menu_items").select("venue_id, is_live, updated_at").in("venue_id", venueIds);
  if (error) throw new Error(`Could not load menu items: ${error.message}`);

  return ((data ?? []) as { venue_id: string; is_live: boolean; updated_at: string }[]).reduce<Record<string, MenuStat>>((stats, row) => {
    const current = stats[row.venue_id] ?? { liveCount: 0, lastUpdatedAt: null };
    stats[row.venue_id] = {
      liveCount: current.liveCount + (row.is_live ? 1 : 0),
      lastUpdatedAt: !current.lastUpdatedAt || row.updated_at > current.lastUpdatedAt ? row.updated_at : current.lastUpdatedAt,
    };
    return stats;
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

/** Badge count for the top-level Bookings nav item: requests still owing a reply. */
export async function getOwnerPendingBookingCount(input: { userId: string }): Promise<number> {
  const venues = await getMyClaimedVenues(input.userId);
  if (!venues.length) return 0;
  return getPendingBookingRequests(venues.map((venue) => venue.id)).then((bookings) => bookings.length);
}

function emptySummary(): OwnerHomeSummary {
  return {
    venues: [],
    metrics: { profileViews: 0, directions: 0, enquiries: 0, saves: 0 },
    pendingBookingRequests: 0,
    newEnquiries: 0,
    oldestPendingBookingAt: null,
    bookingBands: [],
  };
}
