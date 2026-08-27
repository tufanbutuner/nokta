import { mapPromotedOfferRowToOffer } from "@/lib/promotedOfferMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { PromotedOfferRow } from "@/types/database";
import type { PromotedOffer } from "@/types/promotedOffers";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getActiveHomepageOffers(): Promise<PromotedOffer[]> {
  return getActiveOffers();
}

export async function getActiveCityOffers(city: string): Promise<PromotedOffer[]> {
  return getActiveOffers({ city });
}

export async function getActiveAreaOffers(input: { city: string; area: string }): Promise<PromotedOffer[]> {
  return getActiveOffers(input);
}

export async function getActiveVenueOffers(venueId: string): Promise<PromotedOffer[]> {
  const client = ensureSupabase();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("promoted_offers")
    .select("*")
    .eq("venue_id", venueId)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false })
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load promoted offers: ${error.message}`);
  }

  return ((data ?? []) as PromotedOfferRow[]).map(mapPromotedOfferRowToOffer);
}

async function getActiveOffers(filters: { city?: string | null; area?: string | null } = {}) {
  const client = ensureSupabase();
  const now = new Date().toISOString();
  let query = client
    .from("promoted_offers")
    .select("*")
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false })
    .order("starts_at", { ascending: false });

  if (filters.city) {
    query = query.or(`city.is.null,city.eq.${escapeFilterValue(filters.city)}`);
  }

  if (filters.area) {
    query = query.or(`area.is.null,area.eq.${escapeFilterValue(filters.area)}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load promoted offers: ${error.message}`);
  }

  return ((data ?? []) as PromotedOfferRow[]).map(mapPromotedOfferRowToOffer);
}

function escapeFilterValue(value: string) {
  return value.replace(/,/g, "\\,");
}
