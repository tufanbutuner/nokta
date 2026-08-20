import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapVenueRowToVenue } from "@/lib/venueMappers";
import { mapFormValuesToVenueRow } from "@/lib/venueFormMappers";
import type { VenueRow } from "@/types/database";
import type { Venue } from "@/types/venue";
import type { VenueFormValues } from "@/types/venueForm";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function createVenue(input: VenueFormValues): Promise<Venue> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").insert(mapFormValuesToVenueRow(input)).select("*").single();

  if (error) {
    throw new Error(`Could not create venue: ${error.message}`);
  }

  return mapVenueRowToVenue(data as VenueRow);
}

export async function updateVenue(venueId: string, input: VenueFormValues): Promise<Venue> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").update(mapFormValuesToVenueRow(input)).eq("id", venueId).select("*").single();

  if (error) {
    throw new Error(`Could not update venue: ${error.message}`);
  }

  return mapVenueRowToVenue(data as VenueRow);
}

export async function getVenueById(venueId: string): Promise<Venue | null> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("*").eq("id", venueId).maybeSingle();

  if (error) {
    throw new Error(`Could not load venue: ${error.message}`);
  }

  return data ? mapVenueRowToVenue(data as VenueRow) : null;
}
