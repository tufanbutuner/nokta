import { mapVenueRowToVenue } from "@/lib/venueMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueRow } from "@/types/database";
import type { Venue } from "@/types/venue";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getMyClaimedVenues(userId: string): Promise<Venue[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venues")
    .select("*")
    .eq("is_claimed", true)
    .eq("claimed_by", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load claimed venues: ${error.message}`);
  return ((data ?? []) as VenueRow[]).map(mapVenueRowToVenue);
}

export async function getMyClaimedVenue(input: { userId: string; venueId: string }): Promise<Venue | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venues")
    .select("*")
    .eq("id", input.venueId)
    .eq("is_claimed", true)
    .eq("claimed_by", input.userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load claimed venue: ${error.message}`);
  return data ? mapVenueRowToVenue(data as VenueRow) : null;
}

export async function userCanAccessVenue(input: { userId: string; venueId: string }): Promise<boolean> {
  const venue = await getMyClaimedVenue(input);
  return Boolean(venue);
}
