import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyVenueMenuDraft,
  applyVenueMenuSectionsDraft,
  countVenueMenuDraftChanges,
  createEmptyVenueMenuDraft,
  deriveShishaPriceFromPence,
  raisePricesByPercent,
  validateVenueMenuDraft,
} from "@/lib/venueMenuValidation";
import type {
  VenueMenu,
  VenueMenuDraft,
  VenueMenuItemDraftChange,
  VenueMenuItemEdit,
  VenueMenuSection,
  VenueMenuSectionDraftChange,
} from "@/types/venueMenu";

function draftStorageKey(venueId: string) {
  return `nokta-menu-draft-${venueId}`;
}

function readStoredDraft(venueId: string): VenueMenuDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(venueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VenueMenuDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.updated || !Array.isArray(parsed.created) || !Array.isArray(parsed.deletedIds)) return null;
    // Drafts saved before sections joined the draft have no sections key.
    const sections = parsed.sections ?? createEmptyVenueMenuDraft().sections;
    return { updated: parsed.updated, created: parsed.created, deletedIds: parsed.deletedIds, sections };
  } catch {
    return null;
  }
}

/** Drops fields that match the server value, so typing and then undoing leaves no change behind. */
function pruneChange<T extends object>(change: T, original: object): T | null {
  const entries = Object.entries(change).filter(([key, value]) => (original as Record<string, unknown>)[key] !== value);
  return entries.length ? (Object.fromEntries(entries) as T) : null;
}

const newId = () => `new-${crypto.randomUUID()}`;

/**
 * Holds the local menu draft — items and sections alike. Nothing reaches the
 * network until publish, and the draft is mirrored to localStorage per venue
 * so a refresh mid-edit does not lose work.
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

  const serverItems = useMemo(() => menu?.items ?? [], [menu]);
  const serverSections = useMemo(() => menu?.sections ?? [], [menu]);
  const draftItems = useMemo(() => applyVenueMenuDraft({ items: serverItems, draft }), [serverItems, draft]);
  const draftSections = useMemo(() => applyVenueMenuSectionsDraft({ sections: serverSections, draft }), [serverSections, draft]);
  const changeCount = countVenueMenuDraftChanges(draft);
  const validation = useMemo(() => validateVenueMenuDraft({ draft, items: serverItems, sections: serverSections }), [draft, serverItems, serverSections]);
  const derivedPricePence = useMemo(() => {
    const unpriced = new Set([
      ...draft.created.filter((item) => item.pricePence === null).map((item) => item.tempId),
      ...Object.entries(draft.updated).filter(([, change]) => change.pricePence === null).map(([id]) => id),
    ]);
    return deriveShishaPriceFromPence({ items: draftItems.filter((item) => !unpriced.has(item.id)), sections: draftSections });
  }, [draft.created, draft.updated, draftItems, draftSections]);

  const updateItem = useCallback((itemId: string, edit: VenueMenuItemEdit) => {
    setDraft((current) => {
      // Edits to an unsaved item fold into its create entry rather than
      // becoming an update against an id the server has never seen.
      const createdIndex = current.created.findIndex((created) => created.tempId === itemId);
      if (createdIndex >= 0) {
        const created = [...current.created];
        created[createdIndex] = { ...created[createdIndex], ...edit };
        return { ...current, created };
      }
      const change: VenueMenuItemDraftChange = edit;
      const original = serverItems.find((item) => item.id === itemId);
      const merged = { ...current.updated[itemId], ...change };
      const pruned = original ? pruneChange(merged, original) : merged;
      const { [itemId]: _previous, ...others } = current.updated;
      return { ...current, updated: pruned ? { ...others, [itemId]: pruned } : others };
    });
  }, [serverItems]);

  const addItem = useCallback((sectionId: string) => {
    const tempId = newId();
    setDraft((current) => {
      const inSection = applyVenueMenuDraft({ items: serverItems, draft: current }).filter((item) => item.sectionId === sectionId);
      const sortOrder = inSection.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
      return { ...current, created: [...current.created, { tempId, sectionId, name: "", note: null, pricePence: null, isLive: true, sortOrder }] };
    });
    return tempId;
  }, [serverItems]);

  const removeItem = useCallback((itemId: string) => {
    setDraft((current) => {
      if (current.created.some((created) => created.tempId === itemId)) {
        return { ...current, created: current.created.filter((created) => created.tempId !== itemId) };
      }
      const { [itemId]: _removed, ...updated } = current.updated;
      return { ...current, updated, deletedIds: [...current.deletedIds, itemId] };
    });
  }, []);

  /** Swaps an item with its neighbour, renumbering the section so sort orders stay distinct. */
  const moveItem = useCallback((itemId: string, direction: -1 | 1) => {
    const item = draftItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const siblings = draftItems.filter((candidate) => candidate.sectionId === item.sectionId);
    const index = siblings.findIndex((candidate) => candidate.id === itemId);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reordered.forEach((sibling, sortOrder) => {
      if (sibling.sortOrder !== sortOrder) updateItem(sibling.id, { sortOrder });
    });
  }, [draftItems, updateItem]);

  const raiseSectionPrices = useCallback((input: { sectionId: string; percent: number }) => {
    const unpriced = new Set(draft.created.filter((created) => created.pricePence === null).map((created) => created.tempId));
    for (const item of draftItems) {
      if (item.sectionId !== input.sectionId || !item.isLive || unpriced.has(item.id)) continue;
      updateItem(item.id, { pricePence: raisePricesByPercent({ pricePence: item.pricePence, percent: input.percent }) });
    }
  }, [draft.created, draftItems, updateItem]);

  const addSection = useCallback((input: { name: string; isShisha: boolean }) => {
    const tempId = newId();
    setDraft((current) => {
      const sections = applyVenueMenuSectionsDraft({ sections: serverSections, draft: current });
      const sortOrder = sections.reduce((max, section) => Math.max(max, section.sortOrder), -1) + 1;
      return { ...current, sections: { ...current.sections, created: [...current.sections.created, { tempId, name: input.name, isShisha: input.isShisha, sortOrder }] } };
    });
    return tempId;
  }, [serverSections]);

  const updateSection = useCallback((sectionId: string, change: VenueMenuSectionDraftChange) => {
    setDraft((current) => {
      const sectionsDraft = current.sections;
      const createdIndex = sectionsDraft.created.findIndex((created) => created.tempId === sectionId);
      if (createdIndex >= 0) {
        const created = [...sectionsDraft.created];
        created[createdIndex] = { ...created[createdIndex], ...change };
        return { ...current, sections: { ...sectionsDraft, created } };
      }
      const original = serverSections.find((section) => section.id === sectionId);
      const merged = { ...sectionsDraft.updated[sectionId], ...change };
      const pruned = original ? pruneChange(merged, original) : merged;
      const { [sectionId]: _previous, ...rest } = sectionsDraft.updated;
      return { ...current, sections: { ...sectionsDraft, updated: pruned ? { ...rest, [sectionId]: pruned } : rest } };
    });
  }, [serverSections]);

  const moveSection = useCallback((sectionId: string, direction: -1 | 1) => {
    const index = draftSections.findIndex((section) => section.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draftSections.length) return;
    const reordered: VenueMenuSection[] = [...draftSections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reordered.forEach((section, sortOrder) => {
      if (section.sortOrder !== sortOrder) updateSection(section.id, { sortOrder });
    });
  }, [draftSections, updateSection]);

  /** Removes a section and everything in it; pending edits to its items go too. */
  const removeSection = useCallback((sectionId: string) => {
    setDraft((current) => {
      const itemIdsInSection = new Set(serverItems.filter((item) => item.sectionId === sectionId).map((item) => item.id));
      const created = current.created.filter((item) => item.sectionId !== sectionId);
      const updated = Object.fromEntries(Object.entries(current.updated).filter(([itemId]) => !itemIdsInSection.has(itemId)));
      const deletedIds = current.deletedIds.filter((itemId) => !itemIdsInSection.has(itemId));
      const sectionsDraft = current.sections;

      if (sectionsDraft.created.some((section) => section.tempId === sectionId)) {
        return { ...current, created, updated, deletedIds, sections: { ...sectionsDraft, created: sectionsDraft.created.filter((section) => section.tempId !== sectionId) } };
      }
      const { [sectionId]: _removed, ...sectionUpdates } = sectionsDraft.updated;
      return {
        ...current,
        created,
        updated,
        deletedIds,
        sections: { ...sectionsDraft, updated: sectionUpdates, deletedIds: [...sectionsDraft.deletedIds, sectionId] },
      };
    });
  }, [serverItems]);

  const discard = useCallback(() => {
    setDraft(createEmptyVenueMenuDraft());
  }, []);

  return {
    draft,
    draftItems,
    draftSections,
    changeCount,
    validation,
    derivedPricePence,
    updateItem,
    addItem,
    removeItem,
    moveItem,
    raiseSectionPrices,
    addSection,
    updateSection,
    moveSection,
    removeSection,
    discard,
  };
}

export type VenueMenuDraftApi = ReturnType<typeof useVenueMenuDraft>;
