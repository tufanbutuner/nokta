import { mapFeaturedPlacementRowToPlacement } from "@/lib/featuredPlacementMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { FeaturedPlacementRow } from "@/types/database";
import type { FeaturedPlacement, FeaturedPlacementType } from "@/types/featuredPlacements";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getActiveHomepagePlacements(): Promise<FeaturedPlacement[]> {
  return getActivePlacements("homepage");
}

export async function getActiveCityPlacements(city: string): Promise<FeaturedPlacement[]> {
  return getActivePlacements("city", { city });
}

export async function getActiveAreaPlacements(input: { city: string; area: string }): Promise<FeaturedPlacement[]> {
  return getActivePlacements("area", input);
}

export async function getActiveDiscoverPlacements(input: { city?: string | null; area?: string | null }): Promise<FeaturedPlacement[]> {
  return getActivePlacements("discover", input);
}

export async function getActiveRecommendationPlacements(input: { city?: string | null }): Promise<FeaturedPlacement[]> {
  return getActivePlacements("recommendation", input);
}

async function getActivePlacements(type: FeaturedPlacementType, filters: { city?: string | null; area?: string | null } = {}) {
  const client = ensureSupabase();
  let query = client
    .from("featured_placements")
    .select("*")
    .eq("placement_type", type)
    .eq("status", "active")
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
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
    throw new Error(`Could not load featured placements: ${error.message}`);
  }

  return ((data ?? []) as FeaturedPlacementRow[]).map(mapFeaturedPlacementRowToPlacement);
}

function escapeFilterValue(value: string) {
  return value.replace(/,/g, "\\,");
}
