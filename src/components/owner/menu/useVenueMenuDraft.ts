import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyVenueMenuDraft,
  countVenueMenuDraftChanges,
  createEmptyVenueMenuDraft,
  deriveShishaPriceFromPence,
  raisePricesByPercent,
  validateVenueMenuDraft,
} from "@/lib/venueMenuValidation";
import type { VenueMenu, VenueMenuDraft, VenueMenuItem, VenueMenuItemDraftChange } from "@/types/venueMenu";

function draftStorageKey(venueId: string) {
  return `nokta-menu-draft-${venueId}`;
}

function readStoredDraft(venueId: string): VenueMenuDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(venueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VenueMenuDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.updated || !Array.isArray(parsed.created) || !Array.isArray(parsed.deletedIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Holds the local menu draft. Nothing reaches the network until publish, and
 * the draft is mirrored to localStorage per venue so a refresh mid-edit does
 * not lose work.
 */
export function useVenueMenuDraft(input: { venueId: string; menu: VenueMenu | null }) {
  const { venueId, menu } = input;
  const [draft, setDraft] = useState<VenueMenuDraft>(createEmptyVenueMenuDraft);

  useEffect(() => {
    if (!venueId) return;
    const stored = readStoredDraft(venueId);
    setDraft(stored ?? createEmptyVenueMenuDraft());
  }, [venueId]);

  useEffect(() => {
    if (!venueId) return;
    try {
      if (countVenueMenuDraftChanges(draft) === 0) localStorage.removeItem(draftStorageKey(venueId));
      else localStorage.setItem(draftStorageKey(venueId), JSON.stringify(draft));
    } catch {
      // A full or unavailable localStorage must not break editing.
    }
  }, [draft, venueId]);

  const draftItems = useMemo(() => (menu ? applyVenueMenuDraft({ items: menu.items, draft }) : []), [menu, draft]);
  const changeCount = countVenueMenuDraftChanges(draft);
  const validation = useMemo(() => validateVenueMenuDraft({ draft, items: menu?.items ?? [] }), [draft, menu]);
  const derivedPricePence = useMemo(
    () => (menu ? deriveShishaPriceFromPence({ items: draftItems, sections: menu.sections }) : null),
    [draftItems, menu],
  );

  const updateItem = useCallback((itemId: string, change: VenueMenuItemDraftChange) => {
    setDraft((current) => {
      // Edits to an unsaved item fold into its create entry rather than
      // becoming an update against an id the server has never seen.
      const createdIndex = current.created.findIndex((created) => created.tempId === itemId);
      if (createdIndex >= 0) {
        const created = [...current.created];
        created[createdIndex] = { ...created[createdIndex], ...change };
        return { ...current, created };
      }
      return { ...current, updated: { ...current.updated, [itemId]: { ...current.updated[itemId], ...change } } };
    });
  }, []);

  const addItem = useCallback((sectionId: string, sortOrder: number) => {
    const tempId = `new-${crypto.randomUUID()}`;
    setDraft((current) => ({
      ...current,
      created: [...current.created, { tempId, sectionId, name: "", note: null, pricePence: 0, isLive: true, sortOrder }],
    }));
    return tempId;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setDraft((current) => {
      if (current.created.some((created) => created.tempId === itemId)) {
        return { ...current, created: current.created.filter((created) => created.tempId !== itemId) };
      }
      const { [itemId]: _removed, ...updated } = current.updated;
      return { ...current, updated, deletedIds: [...current.deletedIds, itemId] };
    });
  }, []);

  const raiseSectionPrices = useCallback((input: { sectionId: string; percent: number; items: VenueMenuItem[] }) => {
    for (const item of input.items) {
      if (item.sectionId !== input.sectionId || !item.isLive) continue;
      updateItem(item.id, { pricePence: raisePricesByPercent({ pricePence: item.pricePence, percent: input.percent }) });
    }
  }, [updateItem]);

  const discard = useCallback(() => {
    setDraft(createEmptyVenueMenuDraft());
  }, []);

  return { draft, draftItems, changeCount, validation, derivedPricePence, updateItem, addItem, removeItem, raiseSectionPrices, discard };
}
