import { mapVenueSuggestionRowToSuggestion } from "@/lib/venueSuggestionMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueSuggestionRow } from "@/types/database";
import type { VenueSuggestion, VenueSuggestionInput } from "@/types/venueSuggestions";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function createVenueSuggestion(input: {
  userId: string;
  suggestion: VenueSuggestionInput;
}): Promise<VenueSuggestion> {
  const client = ensureSupabase();
  const suggestion = input.suggestion;
  const { data, error } = await client
    .from("venue_suggestions")
    .insert({
      submitted_by: input.userId,
      venue_name: suggestion.venueName.trim(),
      country: suggestion.country.trim(),
      city: suggestion.city.trim(),
      area: nullableText(suggestion.area),
      address: nullableText(suggestion.address),
      postcode: nullableText(suggestion.postcode),
      website: nullableText(suggestion.website),
      instagram: nullableText(suggestion.instagram),
      phone: nullableText(suggestion.phone),
      primary_category: suggestion.primaryCategory ?? "shisha_lounge",
      secondary_categories: suggestion.secondaryCategories ?? ["shisha"],
      notes: nullableText(suggestion.notes),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not submit suggestion: ${error.message}`);
  }

  return mapVenueSuggestionRowToSuggestion(data as VenueSuggestionRow);
}

export async function getMyVenueSuggestions(userId: string): Promise<VenueSuggestion[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_suggestions")
    .select("*")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your suggestions: ${error.message}`);
  }

  return ((data ?? []) as VenueSuggestionRow[]).map(mapVenueSuggestionRowToSuggestion);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
