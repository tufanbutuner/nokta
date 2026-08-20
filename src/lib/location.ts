import type { UserLocation } from "@/types/location";
import type { Venue } from "@/types/venue";

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMiles(from: UserLocation, to: UserLocation): number {
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const lat2 = toRadians(to.latitude);
  const lon2 = toRadians(to.longitude);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;

  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

export function getVenueDistanceMiles(venue: Venue, userLocation: UserLocation): number {
  return calculateDistanceMiles(userLocation, {
    latitude: venue.latitude,
    longitude: venue.longitude,
  });
}

export function formatDistanceMiles(distance: number): string {
  if (distance < 0.1) {
    return "Less than 0.1 mi away";
  }

  if (distance < 10) {
    return `${distance.toFixed(1)} mi away`;
  }

  return `${Math.round(distance)} mi away`;
}
