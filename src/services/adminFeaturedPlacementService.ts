import { mapFeaturedPlacementRowToPlacement } from "@/lib/featuredPlacementMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { FeaturedPlacementRow } from "@/types/database";
import type { FeaturedPlacement, FeaturedPlacementInput, FeaturedPlacementStatus } from "@/types/featuredPlacements";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminFeaturedPlacements(): Promise<FeaturedPlacement[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("featured_placements").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load featured placements: ${error.message}`);
  }

  return ((data ?? []) as FeaturedPlacementRow[]).map(mapFeaturedPlacementRowToPlacement);
}

export async function createFeaturedPlacement(input: { placement: FeaturedPlacementInput; adminUserId: string }): Promise<FeaturedPlacement> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("featured_placements")
    .insert({ ...toRowInput(input.placement), created_by: input.adminUserId, updated_by: input.adminUserId })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not create featured placement: ${error.message}`);
  }

  return mapFeaturedPlacementRowToPlacement(data as FeaturedPlacementRow);
}

export async function updateFeaturedPlacement(input: {
  placementId: string;
  placement: Partial<FeaturedPlacementInput>;
  adminUserId: string;
}): Promise<FeaturedPlacement> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("featured_placements")
    .update({ ...toPartialRowInput(input.placement), updated_by: input.adminUserId })
    .eq("id", input.placementId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update featured placement: ${error.message}`);
  }

  return mapFeaturedPlacementRowToPlacement(data as FeaturedPlacementRow);
}

export async function updateFeaturedPlacementStatus(input: {
  placementId: string;
  status: FeaturedPlacementStatus;
  adminUserId: string;
}): Promise<FeaturedPlacement> {
  return updateFeaturedPlacement({ placementId: input.placementId, placement: { status: input.status }, adminUserId: input.adminUserId });
}

export async function deleteFeaturedPlacement(placementId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("featured_placements").delete().eq("id", placementId);

  if (error) {
    throw new Error(`Could not delete featured placement: ${error.message}`);
  }
}

function toRowInput(placement: FeaturedPlacementInput) {
  return {
    venue_id: placement.venueId,
    placement_type: placement.placementType,
    city: nullableText(placement.city),
    area: nullableText(placement.area),
    title: nullableText(placement.title),
    description: nullableText(placement.description),
    starts_at: placement.startsAt,
    ends_at: placement.endsAt,
    status: placement.status,
    priority: placement.priority ?? 0,
  };
}

function toPartialRowInput(placement: Partial<FeaturedPlacementInput>) {
  return Object.fromEntries(
    Object.entries({
      venue_id: placement.venueId,
      placement_type: placement.placementType,
      city: nullableText(placement.city),
      area: nullableText(placement.area),
      title: nullableText(placement.title),
      description: nullableText(placement.description),
      starts_at: placement.startsAt,
      ends_at: placement.endsAt,
      status: placement.status,
      priority: placement.priority,
    }).filter(([, value]) => value !== undefined),
  );
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
