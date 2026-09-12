import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { RecommendShareCodeRow, RecommendShortlistPickRow, RecommendShortlistRow } from "@/types/database";
import type { RecommendAnswers, RecommendBudget, RecommendShortlist, SaveShortlistInput, SavedShortlistPick } from "@/types/recommendFlow";
import type { RecommendationOccasion } from "@/types/recommendations";
import type { VenueVibe } from "@/types/venue";

const SHARE_CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const SHARE_CODE_LENGTH = 6;

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

/** Ambiguous characters are left out of the alphabet so a code survives being read aloud. */
function generateShareCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(SHARE_CODE_LENGTH));
  return Array.from(values, (value) => SHARE_CODE_ALPHABET[value % SHARE_CODE_ALPHABET.length]).join("");
}

function mapRowToShortlist(row: RecommendShortlistRow, pickRows: RecommendShortlistPickRow[]): RecommendShortlist {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    answers: {
      occasion: (row.occasion as RecommendationOccasion | null) ?? null,
      vibes: (row.vibes ?? []) as VenueVibe[],
      budget: row.budget === null ? null : row.budget === "any" ? "any" : (Number(row.budget) as RecommendBudget),
      distance: (row.distance as RecommendAnswers["distance"]) ?? null,
    },
    picks: pickRows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pick) => ({ venueId: pick.venue_id, role: pick.role, matchLabel: pick.match_label, reason: pick.reason })),
    createdAt: row.created_at,
  };
}

export async function saveRecommendShortlist(input: { userId: string; shortlist: SaveShortlistInput }): Promise<RecommendShortlist> {
  const client = ensureSupabase();
  const { answers } = input.shortlist;

  const { data: shortlistData, error: shortlistError } = await client
    .from("recommend_shortlists")
    .insert({
      user_id: input.userId,
      name: input.shortlist.name.trim(),
      city: input.shortlist.city,
      occasion: answers.occasion,
      vibes: answers.vibes,
      budget: answers.budget === null ? null : String(answers.budget),
      distance: answers.distance,
    })
    .select("*")
    .single();

  if (shortlistError) throw new Error(`Could not save shortlist: ${shortlistError.message}`);
  const shortlistRow = shortlistData as RecommendShortlistRow;

  const { data: pickData, error: pickError } = await client
    .from("recommend_shortlist_picks")
    .insert(
      input.shortlist.picks.map((pick, index) => ({
        shortlist_id: shortlistRow.id,
        venue_id: pick.venueId,
        role: pick.role,
        match_label: pick.matchLabel,
        reason: pick.reason,
        sort_order: index,
      })),
    )
    .select("*");

  if (pickError) throw new Error(`Could not save shortlist picks: ${pickError.message}`);
  return mapRowToShortlist(shortlistRow, (pickData ?? []) as RecommendShortlistPickRow[]);
}

export async function renameRecommendShortlist(input: { shortlistId: string; name: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("recommend_shortlists").update({ name: input.name.trim() }).eq("id", input.shortlistId);
  if (error) throw new Error(`Could not rename shortlist: ${error.message}`);
}

export async function getMyRecommendShortlists(userId: string): Promise<RecommendShortlist[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("recommend_shortlists").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load shortlists: ${error.message}`);

  const rows = (data ?? []) as RecommendShortlistRow[];
  if (!rows.length) return [];

  const { data: pickData, error: pickError } = await client
    .from("recommend_shortlist_picks")
    .select("*")
    .in("shortlist_id", rows.map((row) => row.id));

  if (pickError) throw new Error(`Could not load shortlist picks: ${pickError.message}`);
  const picks = (pickData ?? []) as RecommendShortlistPickRow[];
  return rows.map((row) => mapRowToShortlist(row, picks.filter((pick) => pick.shortlist_id === row.id)));
}

/**
 * Returns the existing code when the shortlist already has one, so sharing twice
 * hands out the same link rather than minting a second.
 */
export async function createRecommendShareCode(input: { userId: string; shortlistId: string }): Promise<string> {
  const client = ensureSupabase();

  const { data: existing, error: existingError } = await client.from("recommend_share_codes").select("*").eq("shortlist_id", input.shortlistId).maybeSingle();
  if (existingError) throw new Error(`Could not read share link: ${existingError.message}`);
  if (existing) return (existing as RecommendShareCodeRow).code;

  const { data, error } = await client
    .from("recommend_share_codes")
    .insert({ code: generateShareCode(), shortlist_id: input.shortlistId, created_by: input.userId })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create share link: ${error.message}`);
  return (data as RecommendShareCodeRow).code;
}

/** Public read: the recipient of a shared link is not signed in. */
export async function getSharedRecommendShortlist(code: string): Promise<RecommendShortlist | null> {
  const client = ensureSupabase();

  const { data: codeData, error: codeError } = await client.from("recommend_share_codes").select("*").eq("code", code).maybeSingle();
  if (codeError) throw new Error(`Could not open this link: ${codeError.message}`);
  if (!codeData) return null;

  const shortlistId = (codeData as RecommendShareCodeRow).shortlist_id;
  const [{ data: shortlistData, error: shortlistError }, { data: pickData, error: pickError }] = await Promise.all([
    client.from("recommend_shortlists").select("*").eq("id", shortlistId).maybeSingle(),
    client.from("recommend_shortlist_picks").select("*").eq("shortlist_id", shortlistId),
  ]);

  if (shortlistError) throw new Error(`Could not open this link: ${shortlistError.message}`);
  if (pickError) throw new Error(`Could not open this link: ${pickError.message}`);
  if (!shortlistData) return null;

  return mapRowToShortlist(shortlistData as RecommendShortlistRow, (pickData ?? []) as RecommendShortlistPickRow[]);
}
