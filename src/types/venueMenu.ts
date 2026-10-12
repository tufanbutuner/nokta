export interface VenueMenuSection {
  id: string;
  venueId: string;
  name: string;
  slug: string;
  isShisha: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueMenuItem {
  id: string;
  venueId: string;
  sectionId: string;
  name: string;
  note: string | null;
  pricePence: number;
  isLive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueMenu {
  sections: VenueMenuSection[];
  items: VenueMenuItem[];
}

/** A pending local edit to an existing item. Nothing reaches the network until publish. */
export interface VenueMenuItemDraftChange {
  name?: string;
  note?: string | null;
  pricePence?: number | null;
  isLive?: boolean;
  sortOrder?: number;
}

/** An edit from the editor. A null price only applies to unsaved items, where it means "not typed yet". */
export type VenueMenuItemEdit = VenueMenuItemDraftChange;

export interface VenueMenuItemDraftCreate {
  tempId: string;
  /** A real section id, or the tempId of a section created in the same draft. */
  sectionId: string;
  name: string;
  note: string | null;
  /** Null until the owner types a price, so a new item never reads as free. */
  pricePence: number | null;
  isLive: boolean;
  sortOrder: number;
}

export interface VenueMenuSectionDraftChange {
  name?: string;
  isShisha?: boolean;
  sortOrder?: number;
}

export interface VenueMenuSectionDraftCreate {
  tempId: string;
  name: string;
  isShisha: boolean;
  sortOrder: number;
}

export interface VenueMenuSectionsDraft {
  updated: Record<string, VenueMenuSectionDraftChange>;
  created: VenueMenuSectionDraftCreate[];
  deletedIds: string[];
}

export interface VenueMenuDraft {
  updated: Record<string, VenueMenuItemDraftChange>;
  created: VenueMenuItemDraftCreate[];
  deletedIds: string[];
  sections: VenueMenuSectionsDraft;
}

export type VenueMenuChangeKind = "price" | "name" | "note" | "visibility" | "order" | "new" | "removed" | "section";

export interface VenueMenuChangeSummary {
  id: string;
  kind: VenueMenuChangeKind;
  label: string;
}

export interface VenueMenuPublishInput {
  venueId: string;
  draft: VenueMenuDraft;
}
