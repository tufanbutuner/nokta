import { buildVenueDetails, getNextLondonDates, type VenueDetails, type VenueDetailsQuery } from "@/lib/venueDetails";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { getActiveVenueOffers } from "@/services/promotedOfferService";
import { getVenueReviewSummaries } from "@/services/reviewService";
import { getPublicVenueMenu } from "@/services/venueMenuService";
import { getVenueBySlug } from "@/services/venueService";
import { getBookingStates, getVenueAvailabilities } from "@/services/venueSearchService";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

/**
 * A venue's details for assistants, by slug. Null when there is no such venue a
 * visitor could find (missing, a test venue, or permanently closed).
 */
export async function getVenueDetailsForAssistant(slug: string, query: VenueDetailsQuery, siteUrl: string): Promise<VenueDetails | null> {
  const venue = await getVenueBySlug(slug);
  if (!venue || venue.isTest || venue.businessStatus === "permanently-closed") return null;

  const fromDate = query.date ?? getNextLondonDates(new Date(), 1)[0];
  const [featured, offers, menu, ratings, bookingStates, availability] = await Promise.all([
    hasActiveFeaturedPlacement(venue.id),
    getActiveVenueOffers(venue.id),
    getPublicVenueMenu(venue.id),
    getVenueReviewSummaries([venue.id]),
    getBookingStates([venue.id]),
    getVenueAvailabilities([venue.id], fromDate),
  ]);

  return buildVenueDetails({
    venue,
    siteUrl,
    featured,
    offers,
    menu,
    rating: ratings[venue.id] ?? null,
    bookingState: bookingStates.get(venue.id) ?? null,
    availability: availability.get(venue.id) ?? null,
    query,
  });
}

async function hasActiveFeaturedPlacement(venueId: string): Promise<boolean> {
  const client = ensureSupabase();
  const now = new Date().toISOString();
  const { count, error } = await client
    .from("featured_placements")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now);
  if (error) throw new Error(`Could not load featured placements: ${error.message}`);
  return (count ?? 0) > 0;
}
