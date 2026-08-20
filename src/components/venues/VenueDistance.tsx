import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import type { UserLocation } from "@/types/location";
import type { Venue } from "@/types/venue";

export function VenueDistance({ venue, userLocation }: { venue: Venue; userLocation?: UserLocation | null }) {
  if (!userLocation) {
    return null;
  }

  return <span>{formatDistanceMiles(getVenueDistanceMiles(venue, userLocation))}</span>;
}
