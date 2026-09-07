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
  pricePence?: number;
  isLive?: boolean;
  sortOrder?: number;
}

export interface VenueMenuItemDraftCreate {
  tempId: string;
  sectionId: string;
  name: string;
  note: string | null;
  pricePence: number;
  isLive: boolean;
  sortOrder: number;
}

export interface VenueMenuDraft {
  updated: Record<string, VenueMenuItemDraftChange>;
  created: VenueMenuItemDraftCreate[];
  deletedIds: string[];
}

export type VenueMenuChangeKind = "price" | "name" | "note" | "visibility" | "order" | "new" | "removed";

export interface VenueMenuChangeSummary {
  id: string;
  kind: VenueMenuChangeKind;
  label: string;
}

export interface VenueMenuPublishInput {
  venueId: string;
  draft: VenueMenuDraft;
}
