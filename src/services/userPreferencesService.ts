import { supabase, supabaseConfigError } from "@/lib/supabase";

const MAX_RECENTLY_VIEWED = 6;

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getUserSavedVenueIds(userId: string): Promise<string[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("user_saved_venues")
    .select("venue_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load saved venues: ${error.message}`);
  }

  return (data ?? []).map((row) => row.venue_id as string);
}

export async function getExistingVenueIds(venueIds: string[]): Promise<string[]> {
  const uniqueVenueIds = Array.from(new Set(venueIds)).filter(Boolean);

  if (!uniqueVenueIds.length) {
    return [];
  }

  const client = ensureSupabase();
  const { data, error } = await client.from("venues").select("id").in("id", uniqueVenueIds);

  if (error) {
    throw new Error(`Could not validate venues: ${error.message}`);
  }

  const existingVenueIds = new Set((data ?? []).map((row) => row.id as string));
  return uniqueVenueIds.filter((venueId) => existingVenueIds.has(venueId));
}

export async function addUserSavedVenue(userId: string, venueId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("user_saved_venues")
    .upsert({ user_id: userId, venue_id: venueId }, { onConflict: "user_id,venue_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Could not save venue: ${error.message}`);
  }
}

export async function removeUserSavedVenue(userId: string, venueId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("user_saved_venues").delete().eq("user_id", userId).eq("venue_id", venueId);

  if (error) {
    throw new Error(`Could not remove saved venue: ${error.message}`);
  }
}

export async function getUserRecentlyViewedVenueIds(userId: string): Promise<string[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("user_recently_viewed_venues")
    .select("venue_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(MAX_RECENTLY_VIEWED);

  if (error) {
    throw new Error(`Could not load recently viewed venues: ${error.message}`);
  }

  return (data ?? []).map((row) => row.venue_id as string);
}

export async function addUserRecentlyViewedVenue(userId: string, venueId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("user_recently_viewed_venues")
    .upsert({ user_id: userId, venue_id: venueId, viewed_at: new Date().toISOString() }, { onConflict: "user_id,venue_id" });

  if (error) {
    throw new Error(`Could not update recently viewed venues: ${error.message}`);
  }

  await pruneRecentlyViewedVenues(userId);
}

async function pruneRecentlyViewedVenues(userId: string): Promise<void> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("user_recently_viewed_venues")
    .select("venue_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false });

  if (error || !data || data.length <= MAX_RECENTLY_VIEWED) {
    return;
  }

  const venueIdsToDelete = data.slice(MAX_RECENTLY_VIEWED).map((row) => row.venue_id as string);
  await client.from("user_recently_viewed_venues").delete().eq("user_id", userId).in("venue_id", venueIdsToDelete);
}
