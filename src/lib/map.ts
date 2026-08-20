import type { Venue } from "@/types/venue";

export const LONDON_CENTER = {
  latitude: 51.5072,
  longitude: -0.1276,
};

export function hasValidCoordinates(venue: Venue): boolean {
  return (
    typeof venue.latitude === "number" &&
    typeof venue.longitude === "number" &&
    !Number.isNaN(venue.latitude) &&
    !Number.isNaN(venue.longitude)
  );
}
