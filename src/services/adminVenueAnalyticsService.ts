import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueAnalyticsEventName, VenueAnalyticsEventRow, VenueAnalyticsSummary } from "@/types/analytics";

export interface AdminAnalyticsFilters {
  city?: string | null;
  venueId?: string | null;
  from: string;
  to: string;
}

export interface AdminAnalyticsDashboardSummary {
  profileViews: number;
  directionsClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  saves: number;
  unsaves: number;
  enquiryCtaClicks: number;
  enquirySubmissions: number;
  featuredViews: number;
  featuredClicks: number;
  offerViews: number;
  offerClicks: number;
  totalEvents: number;
}

export type AnalyticsMetric = "profileViews" | "directionsClicks" | "enquirySubmissions" | "featuredClicks" | "offerClicks";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminVenueAnalyticsEvents(filters: AdminAnalyticsFilters): Promise<VenueAnalyticsEventRow[]> {
  const client = ensureSupabase();
  let query = client
    .from("venue_analytics_events")
    .select("*")
    .gte("created_at", filters.from)
    .lte("created_at", filters.to)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.venueId) query = query.eq("venue_id", filters.venueId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load venue analytics: ${error.message}`);
  return (data ?? []) as VenueAnalyticsEventRow[];
}

export async function getAdminAnalyticsDashboardSummary(filters: AdminAnalyticsFilters): Promise<AdminAnalyticsDashboardSummary> {
  const events = await getAdminVenueAnalyticsEvents(filters);
  return events.reduce(addEventToSummary, createSummary());
}

export async function getAdminVenueAnalyticsSummaries(filters: AdminAnalyticsFilters): Promise<VenueAnalyticsSummary[]> {
  const events = await getAdminVenueAnalyticsEvents(filters);
  const byVenue = new Map<string, VenueAnalyticsSummary>();

  events.forEach((event) => {
    if (!event.venue_id) return;
    const existing = byVenue.get(event.venue_id) ?? createVenueSummary(event);
    addEventToSummary(existing, event);
    byVenue.set(event.venue_id, existing);
  });

  return Array.from(byVenue.values()).sort((a, b) => b.profileViews - a.profileViews);
}

export async function getAdminVenueIdsWithMenuItems(venueIds: string[]): Promise<Set<string>> {
  if (!venueIds.length) return new Set();
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_menu_items").select("venue_id").in("venue_id", venueIds);
  if (error) throw new Error(`Could not load venue menu coverage: ${error.message}`);
  return new Set(((data ?? []) as { venue_id: string }[]).map((row) => row.venue_id));
}

export async function getTopVenuesByMetric(input: { filters: AdminAnalyticsFilters; metric: AnalyticsMetric; limit?: number }): Promise<VenueAnalyticsSummary[]> {
  const summaries = await getAdminVenueAnalyticsSummaries(input.filters);
  return summaries.sort((a, b) => b[input.metric] - a[input.metric]).slice(0, input.limit ?? 10);
}

export function enrichVenueAnalyticsSummaries<T extends VenueAnalyticsSummary>(summaries: T[], venues: { id: string; name: string; city: string; area: string }[]): T[] {
  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  return summaries.map((summary) => {
    const venue = venuesById.get(summary.venueId);
    return {
      ...summary,
      venueName: venue?.name ?? summary.venueName,
      city: summary.city ?? venue?.city,
      area: summary.area ?? venue?.area,
    };
  });
}

function createSummary(): AdminAnalyticsDashboardSummary {
  return {
    profileViews: 0,
    directionsClicks: 0,
    websiteClicks: 0,
    instagramClicks: 0,
    saves: 0,
    unsaves: 0,
    enquiryCtaClicks: 0,
    enquirySubmissions: 0,
    featuredViews: 0,
    featuredClicks: 0,
    offerViews: 0,
    offerClicks: 0,
    totalEvents: 0,
  };
}

function createVenueSummary(event: VenueAnalyticsEventRow): VenueAnalyticsSummary {
  return {
    venueId: event.venue_id ?? "",
    city: event.city,
    area: event.area,
    ...createSummary(),
  };
}

function addEventToSummary<T extends AdminAnalyticsDashboardSummary>(summary: T, event: { event_name: VenueAnalyticsEventName }): T {
  summary.totalEvents += 1;
  if (event.event_name === "venue_profile_viewed") summary.profileViews += 1;
  if (event.event_name === "venue_directions_clicked") summary.directionsClicks += 1;
  if (event.event_name === "venue_website_clicked") summary.websiteClicks += 1;
  if (event.event_name === "venue_instagram_clicked") summary.instagramClicks += 1;
  if (event.event_name === "venue_saved") summary.saves += 1;
  if (event.event_name === "venue_unsaved") summary.unsaves += 1;
  if (event.event_name === "venue_enquiry_cta_clicked") summary.enquiryCtaClicks += 1;
  if (event.event_name === "venue_enquiry_submitted") summary.enquirySubmissions += 1;
  if (event.event_name === "featured_placement_viewed") summary.featuredViews += 1;
  if (event.event_name === "featured_placement_clicked") summary.featuredClicks += 1;
  if (event.event_name === "promoted_offer_viewed") summary.offerViews += 1;
  if (event.event_name === "promoted_offer_clicked") summary.offerClicks += 1;
  return summary;
}
