import type { VenueMenuChangeSummary, VenueMenuDraft, VenueMenuItem, VenueMenuItemDraftCreate, VenueMenuSection } from "@/types/venueMenu";

export const MAX_MENU_ITEM_PRICE_PENCE = 99_900;
export const MAX_MENU_ITEM_NAME_LENGTH = 80;
export const MAX_MENU_ITEM_NOTE_LENGTH = 120;
export const MAX_MENU_SECTION_NAME_LENGTH = 60;

export interface VenueMenuValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

/**
 * Parses owner price input into pence. Accepts "18", "18.5", "18.50", "£18",
 * "£18.50" and surrounding whitespace. Returns null when the input cannot be
 * read as a price, so callers can distinguish "invalid" from "zero".
 */
export function parsePriceInputToPence(value: string): number | null {
  const cleaned = value.trim().replace(/^£/, "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const pence = Math.round(Number(cleaned) * 100);
  if (!Number.isFinite(pence)) return null;
  return pence;
}

export function formatPenceAsPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
}

/** venues.price_from is stored in whole pounds, rounded down so we never overstate "from". */
export function pencePriceToPoundsFloor(pence: number): number {
  return Math.floor(pence / 100);
}

export function validateMenuItemName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Add an item name.";
  if (trimmed.length > MAX_MENU_ITEM_NAME_LENGTH) return `Name must be under ${MAX_MENU_ITEM_NAME_LENGTH} characters.`;
  return null;
}

export function validateMenuItemNote(note: string | null): string | null {
  if (!note) return null;
  if (note.length > MAX_MENU_ITEM_NOTE_LENGTH) return `Note must be under ${MAX_MENU_ITEM_NOTE_LENGTH} characters.`;
  return null;
}

export function validateMenuItemPricePence(pence: number | null): string | null {
  if (pence === null) return "Enter a price like 18 or 18.50.";
  if (!Number.isInteger(pence)) return "Price must be a whole number of pence.";
  if (pence < 0) return "Price cannot be negative.";
  if (pence > MAX_MENU_ITEM_PRICE_PENCE) return "Price must be £999 or less.";
  return null;
}

export function validateMenuSectionName(name: string, existingSections: VenueMenuSection[], sectionId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Add a section name.";
  if (trimmed.length > MAX_MENU_SECTION_NAME_LENGTH) return `Section name must be under ${MAX_MENU_SECTION_NAME_LENGTH} characters.`;
  const clash = existingSections.some((section) => section.id !== sectionId && section.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (clash) return "You already have a section with that name.";
  return null;
}

export function toSectionSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function validateVenueMenuDraft(input: { draft: VenueMenuDraft; items: VenueMenuItem[] }): VenueMenuValidationResult {
  const errors: Record<string, string> = {};

  for (const [itemId, change] of Object.entries(input.draft.updated)) {
    const item = input.items.find((candidate) => candidate.id === itemId);
    if (!item) continue;

    if (change.name !== undefined) {
      const nameError = validateMenuItemName(change.name);
      if (nameError) errors[`${itemId}.name`] = nameError;
    }
    if (change.note !== undefined) {
      const noteError = validateMenuItemNote(change.note);
      if (noteError) errors[`${itemId}.note`] = noteError;
    }
    if (change.pricePence !== undefined) {
      const priceError = validateMenuItemPricePence(change.pricePence);
      if (priceError) errors[`${itemId}.price`] = priceError;
    }
  }

  for (const created of input.draft.created) {
    const nameError = validateMenuItemName(created.name);
    if (nameError) errors[`${created.tempId}.name`] = nameError;
    const noteError = validateMenuItemNote(created.note);
    if (noteError) errors[`${created.tempId}.note`] = noteError;
    const priceError = validateMenuItemPricePence(created.pricePence);
    if (priceError) errors[`${created.tempId}.price`] = priceError;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function countVenueMenuDraftChanges(draft: VenueMenuDraft): number {
  return Object.keys(draft.updated).length + draft.created.length + draft.deletedIds.length;
}

export function isVenueMenuDraftEmpty(draft: VenueMenuDraft): boolean {
  return countVenueMenuDraftChanges(draft) === 0;
}

export function createEmptyVenueMenuDraft(): VenueMenuDraft {
  return { updated: {}, created: [], deletedIds: [] };
}

/**
 * Applies the draft over the server state to produce what the public page
 * would show. The editor's summary card and preview both read this, so a
 * price edit updates every surface at once.
 */
export function applyVenueMenuDraft(input: { items: VenueMenuItem[]; draft: VenueMenuDraft }): VenueMenuItem[] {
  const deleted = new Set(input.draft.deletedIds);
  const updatedItems = input.items
    .filter((item) => !deleted.has(item.id))
    .map((item) => {
      const change = input.draft.updated[item.id];
      return change ? { ...item, ...change } : item;
    });

  const createdItems = input.draft.created.map((created) => draftCreateToItem(created, input.items[0]?.venueId ?? ""));
  return [...updatedItems, ...createdItems].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function draftCreateToItem(created: VenueMenuItemDraftCreate, venueId: string): VenueMenuItem {
  const now = new Date().toISOString();
  return {
    id: created.tempId,
    venueId,
    sectionId: created.sectionId,
    name: created.name,
    note: created.note,
    pricePence: created.pricePence,
    isLive: created.isLive,
    sortOrder: created.sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * priceFrom is derived: the cheapest live item in a shisha section. Returns
 * null when nothing qualifies, so callers keep the venue's existing value.
 */
export function deriveShishaPriceFromPence(input: { items: VenueMenuItem[]; sections: VenueMenuSection[] }): number | null {
  const shishaSectionIds = new Set(input.sections.filter((section) => section.isShisha).map((section) => section.id));
  const livePrices = input.items
    .filter((item) => item.isLive && shishaSectionIds.has(item.sectionId))
    .map((item) => item.pricePence);

  if (!livePrices.length) return null;
  return Math.min(...livePrices);
}

/** One line per pending change, for the unpublished-changes tray. */
export function summariseVenueMenuDraft(input: { draft: VenueMenuDraft; items: VenueMenuItem[] }): VenueMenuChangeSummary[] {
  const summaries: VenueMenuChangeSummary[] = [];

  for (const [itemId, change] of Object.entries(input.draft.updated)) {
    const item = input.items.find((candidate) => candidate.id === itemId);
    if (!item) continue;

    if (change.pricePence !== undefined && change.pricePence !== item.pricePence) {
      summaries.push({ id: itemId, kind: "price", label: `${item.name} · ${formatPenceAsPrice(item.pricePence)} → ${formatPenceAsPrice(change.pricePence)}` });
    }
    if (change.isLive !== undefined && change.isLive !== item.isLive) {
      summaries.push({ id: `${itemId}-live`, kind: "visibility", label: `${item.name} · ${change.isLive ? "shown" : "hidden"}` });
    }
    if (change.name !== undefined && change.name !== item.name) {
      summaries.push({ id: `${itemId}-name`, kind: "name", label: `${item.name} → ${change.name}` });
    }
    if (change.note !== undefined && change.note !== item.note) {
      summaries.push({ id: `${itemId}-note`, kind: "note", label: `${item.name} · note updated` });
    }
  }

  for (const created of input.draft.created) {
    summaries.push({ id: created.tempId, kind: "new", label: `${created.name || "Untitled item"} · new item` });
  }

  for (const deletedId of input.draft.deletedIds) {
    const item = input.items.find((candidate) => candidate.id === deletedId);
    summaries.push({ id: deletedId, kind: "removed", label: `${item?.name ?? "Item"} · removed` });
  }

  return summaries;
}

export function raisePricesByPercent(input: { pricePence: number; percent: number }): number {
  // Round to the nearest 50p so a bulk raise lands on prices owners would type.
  const raised = input.pricePence * (1 + input.percent / 100);
  return Math.min(Math.round(raised / 50) * 50, MAX_MENU_ITEM_PRICE_PENCE);
}
