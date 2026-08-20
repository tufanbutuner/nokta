import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapVenueRowToVenue } from "@/lib/venueMappers";
import type { VenueRow } from "@/types/database";
import type { Venue } from "@/types/venue";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getVenues(): Promise<Venue[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("*").order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load venues from Supabase: ${error.message}`);
  }

  return ((data ?? []) as VenueRow[]).map(mapVenueRowToVenue);
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    throw new Error(`Could not load venue from Supabase: ${error.message}`);
  }

  return data ? mapVenueRowToVenue(data as VenueRow) : null;
}
