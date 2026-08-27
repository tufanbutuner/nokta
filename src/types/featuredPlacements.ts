export type FeaturedPlacementType = "homepage" | "city" | "area" | "discover" | "recommendation";

export type FeaturedPlacementStatus = "draft" | "active" | "paused" | "expired" | "cancelled";

export interface FeaturedPlacement {
  id: string;
  venueId: string;
  placementType: FeaturedPlacementType;
  city: string | null;
  area: string | null;
  title: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: FeaturedPlacementStatus;
  priority: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedPlacementInput {
  venueId: string;
  placementType: FeaturedPlacementType;
  city?: string | null;
  area?: string | null;
  title?: string | null;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  status: FeaturedPlacementStatus;
  priority?: number;
}
