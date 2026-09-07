import { trackEvent } from "@/lib/analytics";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapVenueMenuItemRowToItem, mapVenueMenuSectionRowToSection } from "@/lib/venueMenuMappers";
import { applyVenueMenuDraft, deriveShishaPriceFromPence, pencePriceToPoundsFloor, toSectionSlug } from "@/lib/venueMenuValidation";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueMenuItemRow, VenueMenuSectionRow } from "@/types/database";
import type { VenueMenu, VenueMenuDraft, VenueMenuSection } from "@/types/venueMenu";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

async function ensureOwnedVenue(input: { userId: string; venueId: string }) {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You can only edit menus for venues you manage.");
  return venue;
}

/** Owner-facing read: every item, live or hidden. */
export async function getOwnerVenueMenu(input: { userId: string; venueId: string }): Promise<VenueMenu> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();

  const [sectionsResult, itemsResult] = await Promise.all([
    client.from("venue_menu_sections").select("*").eq("venue_id", venue.id).order("sort_order", { ascending: true }),
    client.from("venue_menu_items").select("*").eq("venue_id", venue.id).order("sort_order", { ascending: true }),
  ]);

  if (sectionsResult.error) throw new Error(`Could not load menu sections: ${sectionsResult.error.message}`);
  if (itemsResult.error) throw new Error(`Could not load menu items: ${itemsResult.error.message}`);

  return {
    sections: ((sectionsResult.data ?? []) as VenueMenuSectionRow[]).map(mapVenueMenuSectionRowToSection),
    items: ((itemsResult.data ?? []) as VenueMenuItemRow[]).map(mapVenueMenuItemRowToItem),
  };
}

/** Public-facing read: live items only, enforced by RLS as well as here. */
export async function getPublicVenueMenu(venueId: string): Promise<VenueMenu> {
  const client = ensureSupabase();

  const [sectionsResult, itemsResult] = await Promise.all([
    client.from("venue_menu_sections").select("*").eq("venue_id", venueId).order("sort_order", { ascending: true }),
    client.from("venue_menu_items").select("*").eq("venue_id", venueId).eq("is_live", true).order("sort_order", { ascending: true }),
  ]);

  if (sectionsResult.error) throw new Error(`Could not load menu: ${sectionsResult.error.message}`);
  if (itemsResult.error) throw new Error(`Could not load menu: ${itemsResult.error.message}`);

  const items = ((itemsResult.data ?? []) as VenueMenuItemRow[]).map(mapVenueMenuItemRowToItem);
  const usedSectionIds = new Set(items.map((item) => item.sectionId));

  return {
    sections: ((sectionsResult.data ?? []) as VenueMenuSectionRow[]).map(mapVenueMenuSectionRowToSection).filter((section) => usedSectionIds.has(section.id)),
    items,
  };
}

export async function createVenueMenuSection(input: { userId: string; venueId: string; name: string; isShisha?: boolean }): Promise<VenueMenuSection> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();

  const { data: existing, error: existingError } = await client.from("venue_menu_sections").select("sort_order").eq("venue_id", venue.id).order("sort_order", { ascending: false }).limit(1);
  if (existingError) throw new Error(`Could not add section: ${existingError.message}`);

  const nextSortOrder = ((existing ?? [])[0]?.sort_order ?? -1) + 1;
  const { data, error } = await client
    .from("venue_menu_sections")
    .insert({ venue_id: venue.id, name: input.name.trim(), slug: toSectionSlug(input.name), is_shisha: input.isShisha ?? false, sort_order: nextSortOrder })
    .select("*")
    .single();

  if (error) throw new Error(`Could not add section: ${error.message}`);
  trackEvent("owner_menu_section_created", { venueId: venue.id });
  return mapVenueMenuSectionRowToSection(data as VenueMenuSectionRow);
}

export async function renameVenueMenuSection(input: { userId: string; venueId: string; sectionId: string; name: string }): Promise<VenueMenuSection> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();

  const { data, error } = await client
    .from("venue_menu_sections")
    .update({ name: input.name.trim(), slug: toSectionSlug(input.name) })
    .eq("id", input.sectionId)
    .eq("venue_id", venue.id)
    .select("*")
    .single();

  if (error) throw new Error(`Could not rename section: ${error.message}`);
  return mapVenueMenuSectionRowToSection(data as VenueMenuSectionRow);
}

export async function deleteVenueMenuSection(input: { userId: string; venueId: string; sectionId: string }): Promise<void> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();

  const { error } = await client.from("venue_menu_sections").delete().eq("id", input.sectionId).eq("venue_id", venue.id);
  if (error) throw new Error(`Could not remove section: ${error.message}`);

  // Items cascade with the section, so price_from may no longer be accurate.
  await recalculateVenuePriceFrom({ userId: input.userId, venueId: venue.id });
}

/**
 * Writes the whole draft, then recomputes venues.price_from from the result.
 *
 * Supabase's REST client has no multi-statement transaction, so this applies
 * deletes, updates and inserts in sequence and surfaces the first failure. A
 * partial apply is possible; the caller refetches on error so the editor shows
 * true server state rather than a stale draft.
 */
export async function publishVenueMenu(input: { userId: string; venueId: string; draft: VenueMenuDraft }): Promise<VenueMenu> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();
  const { draft } = input;

  if (draft.deletedIds.length) {
    const { error } = await client.from("venue_menu_items").delete().eq("venue_id", venue.id).in("id", draft.deletedIds);
    if (error) throw new Error(`Could not remove items: ${error.message}`);
  }

  for (const [itemId, change] of Object.entries(draft.updated)) {
    const patch: Partial<VenueMenuItemRow> = {};
    if (change.name !== undefined) patch.name = change.name.trim();
    if (change.note !== undefined) patch.note = change.note?.trim() || null;
    if (change.pricePence !== undefined) patch.price_pence = change.pricePence;
    if (change.isLive !== undefined) patch.is_live = change.isLive;
    if (change.sortOrder !== undefined) patch.sort_order = change.sortOrder;
    if (!Object.keys(patch).length) continue;

    const { error } = await client.from("venue_menu_items").update(patch).eq("id", itemId).eq("venue_id", venue.id);
    if (error) throw new Error(`Could not update items: ${error.message}`);
  }

  if (draft.created.length) {
    const { error } = await client.from("venue_menu_items").insert(
      draft.created.map((created) => ({
        venue_id: venue.id,
        section_id: created.sectionId,
        name: created.name.trim(),
        note: created.note?.trim() || null,
        price_pence: created.pricePence,
        is_live: created.isLive,
        sort_order: created.sortOrder,
      })),
    );
    if (error) throw new Error(`Could not add items: ${error.message}`);
  }

  const menu = await getOwnerVenueMenu({ userId: input.userId, venueId: venue.id });
  await writeDerivedPriceFrom({ venueId: venue.id, menu });

  trackEvent("owner_menu_published", {
    venueId: venue.id,
    updated: Object.keys(draft.updated).length,
    created: draft.created.length,
    deleted: draft.deletedIds.length,
  });

  return menu;
}

export async function recalculateVenuePriceFrom(input: { userId: string; venueId: string }): Promise<number | null> {
  const menu = await getOwnerVenueMenu(input);
  return writeDerivedPriceFrom({ venueId: input.venueId, menu });
}

/**
 * venues.price_from is displayed as "From £{price_from}" across the public
 * app, so the derived pence value is written back in whole pounds. A venue
 * with no live shisha items keeps whatever price_from it already had.
 */
async function writeDerivedPriceFrom(input: { venueId: string; menu: VenueMenu }): Promise<number | null> {
  const derivedPence = deriveShishaPriceFromPence({ items: input.menu.items, sections: input.menu.sections });
  if (derivedPence === null) return null;

  const client = ensureSupabase();
  const pounds = pencePriceToPoundsFloor(derivedPence);
  const { error } = await client.from("venues").update({ price_from: pounds }).eq("id", input.venueId);
  if (error) throw new Error(`Menu saved, but the venue price could not be updated: ${error.message}`);
  return pounds;
}

export type VenueMenuLinkField = "menuUrl" | "shishaMenuUrl" | "shishaPageUrl";

const MENU_LINK_COLUMNS: Record<VenueMenuLinkField, string> = {
  menuUrl: "menuUrl",
  shishaMenuUrl: "shishaMenuUrl",
  shishaPageUrl: "shishaPageUrl",
};

/**
 * The three menu links live in venues.data_sources (jsonb) and are owner-owned
 * alongside menu items — they publish immediately rather than routing through
 * venue_update_requests.
 */
export async function updateVenueMenuLinks(input: { userId: string; venueId: string; links: Partial<Record<VenueMenuLinkField, string | null>> }): Promise<void> {
  const venue = await ensureOwnedVenue(input);
  const client = ensureSupabase();

  const nextDataSources = { ...venue.dataSources };
  for (const [field, value] of Object.entries(input.links) as [VenueMenuLinkField, string | null][]) {
    const key = MENU_LINK_COLUMNS[field];
    const trimmed = value?.trim();
    if (trimmed) nextDataSources[key as keyof typeof nextDataSources] = trimmed;
    else delete nextDataSources[key as keyof typeof nextDataSources];
  }

  const { error } = await client.from("venues").update({ data_sources: nextDataSources }).eq("id", venue.id);
  if (error) throw new Error(`Could not save menu links: ${error.message}`);
  trackEvent("owner_menu_links_updated", { venueId: venue.id });
}

/** The draft's view of what the public page would show, without a refetch. */
export function getDraftVenueMenu(input: { menu: VenueMenu; draft: VenueMenuDraft }): VenueMenu {
  return { sections: input.menu.sections, items: applyVenueMenuDraft({ items: input.menu.items, draft: input.draft }) };
}
