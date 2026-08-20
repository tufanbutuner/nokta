import type { Venue } from "@/types/venue";

export function getGoogleMapsDirectionsUrl(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.postcode}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
