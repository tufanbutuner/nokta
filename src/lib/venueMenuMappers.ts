import type { VenueMenuItemRow, VenueMenuSectionRow } from "@/types/database";
import type { VenueMenuItem, VenueMenuSection } from "@/types/venueMenu";

export function mapVenueMenuSectionRowToSection(row: VenueMenuSectionRow): VenueMenuSection {
  return {
    id: row.id,
    venueId: row.venue_id,
    name: row.name,
    slug: row.slug,
    isShisha: row.is_shisha,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVenueMenuItemRowToItem(row: VenueMenuItemRow): VenueMenuItem {
  return {
    id: row.id,
    venueId: row.venue_id,
    sectionId: row.section_id,
    name: row.name,
    note: row.note,
    pricePence: row.price_pence,
    isLive: row.is_live,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
