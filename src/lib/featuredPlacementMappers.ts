import type { FeaturedPlacementRow } from "@/types/database";
import type { FeaturedPlacement } from "@/types/featuredPlacements";

export function mapFeaturedPlacementRowToPlacement(row: FeaturedPlacementRow): FeaturedPlacement {
  return {
    id: row.id,
    venueId: row.venue_id,
    placementType: row.placement_type,
    city: row.city,
    area: row.area,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    priority: row.priority,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
