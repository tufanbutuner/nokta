import type { Venue } from "@/types/venue";
import type { UserLocation } from "@/types/location";
import { getCityByName } from "@/lib/cities";

export const LONDON_CENTER = {
  latitude: 51.5072,
  longitude: -0.1276,
  defaultZoom: 11,
};

export function getMapCenterForCity(cityName: string) {
  const city = getCityByName(cityName);

  if (!city) {
    return LONDON_CENTER;
  }

  return {
    latitude: city.latitude,
    longitude: city.longitude,
    defaultZoom: city.defaultZoom,
  };
}

export function hasValidCoordinates(venue: Venue): boolean {
  return hasValidLatLng(venue.latitude, venue.longitude);
}

export function hasValidUserLocation(userLocation?: UserLocation | null): userLocation is UserLocation {
  return Boolean(userLocation && hasValidLatLng(userLocation.latitude, userLocation.longitude));
}

function hasValidLatLng(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
