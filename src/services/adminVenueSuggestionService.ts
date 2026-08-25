import { mapVenueSuggestionRowToSuggestion } from "@/lib/venueSuggestionMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueSuggestionRow } from "@/types/database";
import type { VenueSuggestion, VenueSuggestionStatus } from "@/types/venueSuggestions";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminVenueSuggestions(): Promise<VenueSuggestion[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_suggestions").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load venue suggestions: ${error.message}`);
  }

  return ((data ?? []) as VenueSuggestionRow[]).map(mapVenueSuggestionRowToSuggestion);
}

export async function getAdminVenueSuggestionsByStatus(status: VenueSuggestionStatus): Promise<VenueSuggestion[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_suggestions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load ${status} suggestions: ${error.message}`);
  }

  return ((data ?? []) as VenueSuggestionRow[]).map(mapVenueSuggestionRowToSuggestion);
}

export async function getAdminVenueSuggestionById(suggestionId: string): Promise<VenueSuggestion | null> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_suggestions").select("*").eq("id", suggestionId).maybeSingle();

  if (error) {
    throw new Error(`Could not load venue suggestion: ${error.message}`);
  }

  return data ? mapVenueSuggestionRowToSuggestion(data as VenueSuggestionRow) : null;
}

export async function updateVenueSuggestionStatus(input: {
  suggestionId: string;
  status: VenueSuggestionStatus;
  adminUserId: string;
  adminNotes?: string | null;
}): Promise<VenueSuggestion> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_suggestions")
    .update({
      status: input.status,
      admin_notes: nullableText(input.adminNotes),
      reviewed_by: input.adminUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.suggestionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update suggestion: ${error.message}`);
  }

  return mapVenueSuggestionRowToSuggestion(data as VenueSuggestionRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
