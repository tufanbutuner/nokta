import type { Venue } from "@/types/venue";

export function getVenueAnalyticsProperties(venue: Venue) {
  return {
    venueId: venue.id,
    venueSlug: venue.slug,
    venueName: venue.name,
    primaryCategory: venue.primaryCategory,
    area: venue.area,
  };
}
