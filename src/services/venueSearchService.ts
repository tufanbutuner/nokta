import { mapVenueBookingBlackoutDateRow, mapVenueBookingSettingsRow, mapVenueBookingWindowRow } from "@/lib/bookingAvailabilityMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { matchesVenueSearchPlaceAndType, searchVenues, validateVenueSearchQuery, type VenueSearchQuery, type VenueSearchResponse } from "@/lib/venueSearch";
import { getActiveAreaPlacements, getActiveCityPlacements, getActiveHomepagePlacements } from "@/services/featuredPlacementService";
import { getActiveAreaOffers, getActiveCityOffers, getActiveHomepageOffers } from "@/services/promotedOfferService";
import { getVenues } from "@/services/venueService";
import type { VenueBookingAvailability, VenueBookingBookedSlot, VenueBookingState } from "@/types/bookingAvailability";
import type { VenueBookingBlackoutDateRow, VenueBookingSettingsRow, VenueBookingWindowRow } from "@/types/database";
import type { Venue } from "@/types/venue";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

/**
 * Searches venues the way an assistant asks: by city, area, type, free date and
 * time, and offers. Loads only what the query needs; booking availability is
 * fetched live (never cached) and only for venues that can match.
 */
export async function searchVenuesForAssistant(query: VenueSearchQuery, siteUrl: string): Promise<VenueSearchResponse> {
  validateVenueSearchQuery(query);
  const city = query.city?.trim() || null;
  const area = query.area?.trim() || null;

  const [venues, placements, offers] = await Promise.all([
    getSearchableVenues(),
    city && area ? getActiveAreaPlacements({ city, area }) : city ? getActiveCityPlacements(city) : getActiveHomepagePlacements(),
    city && area ? getActiveAreaOffers({ city, area }) : city ? getActiveCityOffers(city) : getActiveHomepageOffers(),
  ]);

  const searchableIds = new Set(venues.map((venue) => venue.id));
  const context = {
    venues,
    placements: placements.filter((placement) => searchableIds.has(placement.venueId)),
    offers: offers.filter((offer) => searchableIds.has(offer.venueId)),
    siteUrl,
  };

  if (!query.date) return searchVenues(context, query);

  const candidateIds = venues.filter((venue) => matchesVenueSearchPlaceAndType(venue, query)).map((venue) => venue.id);
  const [bookingStates, availability] = await Promise.all([getBookingStates(candidateIds), getVenueAvailabilities(candidateIds, query.date)]);
  return searchVenues({ ...context, bookingStates, availability }, query);
}

/** What a visitor can find: matches useVenues for anyone who is not an admin. */
export async function getSearchableVenues(): Promise<Venue[]> {
  const venues = await getVenues();
  return venues.filter((venue) => !venue.isTest && venue.businessStatus !== "permanently-closed");
}

export async function getBookingStates(venueIds: string[]): Promise<Map<string, VenueBookingState>> {
  if (!venueIds.length) return new Map();
  const client = ensureSupabase();
  const { data, error } = await client.from("public_venue_booking_states").select("venue_id, state").in("venue_id", venueIds);
  if (error) throw new Error(`Could not load booking status: ${error.message}`);

  // Same rule as getVenueBookingGate: only the two explicit "cannot take requests" states block.
  return new Map(((data ?? []) as { venue_id: string; state: string }[]).map((row) => [row.venue_id, row.state === "unclaimed" || row.state === "disabled" ? row.state : "live"]));
}

/**
 * Booking availability for many venues in four queries. Booked slots come from
 * venue_booked_slot_counts (sprint 55), which anyone may call, so anonymous
 * searches see slots that are already full.
 */
export async function getVenueAvailabilities(venueIds: string[], fromDate: string): Promise<Map<string, VenueBookingAvailability | null>> {
  if (!venueIds.length) return new Map();
  const client = ensureSupabase();
  const [settingsResult, windowsResult, blackoutResult, bookedResult] = await Promise.all([
    client.from("venue_booking_settings").select("*").in("venue_id", venueIds),
    client.from("venue_booking_windows").select("*").in("venue_id", venueIds).order("day_of_week").order("start_time"),
    client.from("venue_booking_blackout_dates").select("*").in("venue_id", venueIds).gte("blackout_date", fromDate),
    client.rpc("venue_booked_slot_counts", { p_venue_ids: venueIds, p_from: fromDate }),
  ]);
  if (settingsResult.error) throw new Error(`Could not load booking settings: ${settingsResult.error.message}`);
  if (windowsResult.error) throw new Error(`Could not load booking windows: ${windowsResult.error.message}`);
  if (blackoutResult.error) throw new Error(`Could not load blackout dates: ${blackoutResult.error.message}`);
  if (bookedResult.error) throw new Error(`Could not load booked slots: ${bookedResult.error.message}`);

  const windows = ((windowsResult.data ?? []) as VenueBookingWindowRow[]).map(mapVenueBookingWindowRow);
  const blackoutDates = ((blackoutResult.data ?? []) as VenueBookingBlackoutDateRow[]).map(mapVenueBookingBlackoutDateRow);
  const bookedSlots = expandBookedSlotCounts((bookedResult.data ?? []) as BookedSlotCountRow[]);

  const availability = new Map<string, VenueBookingAvailability | null>(venueIds.map((id) => [id, null]));
  for (const row of (settingsResult.data ?? []) as VenueBookingSettingsRow[]) {
    const settings = mapVenueBookingSettingsRow(row);
    availability.set(settings.venueId, {
      settings,
      windows: windows.filter((window) => window.venueId === settings.venueId),
      blackoutDates: blackoutDates.filter((blackout) => blackout.venueId === settings.venueId),
      bookedSlots: bookedSlots.get(settings.venueId) ?? [],
    });
  }
  return availability;
}

interface BookedSlotCountRow {
  venue_id: string;
  slot_date: string;
  slot_time: string;
  taken: number;
}

/** The availability rules count slots, so a count of n becomes n copies of that slot. */
export function expandBookedSlotCounts(rows: BookedSlotCountRow[]): Map<string, VenueBookingBookedSlot[]> {
  const byVenue = new Map<string, VenueBookingBookedSlot[]>();
  for (const row of rows) {
    const slots = byVenue.get(row.venue_id) ?? [];
    for (let index = 0; index < row.taken; index += 1) slots.push({ date: row.slot_date, time: row.slot_time });
    byVenue.set(row.venue_id, slots);
  }
  return byVenue;
}
