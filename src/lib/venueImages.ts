import type { Venue } from "@/types/venue";

export const VENUE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85";

export function getVenueImage(venue: Venue) {
  return venue.images[0] ?? VENUE_IMAGE_FALLBACK;
}
