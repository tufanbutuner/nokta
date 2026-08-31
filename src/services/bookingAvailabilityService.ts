import { mapVenueBookingBlackoutDateRow, mapVenueBookingSettingsRow, mapVenueBookingWindowRow } from "@/lib/bookingAvailabilityMappers";
import { checkBookingAvailability } from "@/lib/bookingAvailabilityValidation";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { BookingAvailabilityCheckResult, VenueBookingAvailability } from "@/types/bookingAvailability";
import type { VenueBookingBlackoutDateRow, VenueBookingSettingsRow, VenueBookingWindowRow } from "@/types/database";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getVenueBookingAvailability(venueId: string): Promise<VenueBookingAvailability | null> {
  const client = ensureSupabase();
  const [{ data: settings, error: settingsError }, { data: windows, error: windowsError }, { data: blackoutDates, error: blackoutError }] = await Promise.all([
    client.from("venue_booking_settings").select("*").eq("venue_id", venueId).maybeSingle(),
    client.from("venue_booking_windows").select("*").eq("venue_id", venueId).order("day_of_week").order("start_time"),
    client.from("venue_booking_blackout_dates").select("*").eq("venue_id", venueId).order("blackout_date"),
  ]);
  if (settingsError) throw new Error(`Could not load booking settings: ${settingsError.message}`);
  if (windowsError) throw new Error(`Could not load booking windows: ${windowsError.message}`);
  if (blackoutError) throw new Error(`Could not load blackout dates: ${blackoutError.message}`);
  if (!settings) return null;
  return {
    settings: mapVenueBookingSettingsRow(settings as VenueBookingSettingsRow),
    windows: ((windows ?? []) as VenueBookingWindowRow[]).map(mapVenueBookingWindowRow),
    blackoutDates: ((blackoutDates ?? []) as VenueBookingBlackoutDateRow[]).map(mapVenueBookingBlackoutDateRow),
  };
}

export async function checkVenueBookingRequestAvailability(input: { venueId: string; requestedDate: string; requestedTime: string; partySize: number }): Promise<BookingAvailabilityCheckResult> {
  const availability = await getVenueBookingAvailability(input.venueId);
  if (!availability) return { isAvailable: true, errors: [], warnings: ["Booking availability settings are not configured yet."] };
  return checkBookingAvailability({ availability, requestedDate: input.requestedDate, requestedTime: input.requestedTime, partySize: input.partySize });
}
