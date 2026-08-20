import L from "leaflet";
import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { VenueMapPopup } from "@/components/map/VenueMapPopup";
import type { Venue } from "@/types/venue";

const venueMarkerIcon = L.divIcon({
  className: "",
  html: '<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-semibold text-primary-foreground shadow-lg shadow-stone-950/25">£</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

export function VenueMapMarker({ venue, selected }: { venue: Venue; selected?: boolean }) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
    }
  }, [selected]);

  return (
    <Marker ref={markerRef} position={[venue.latitude, venue.longitude]} icon={venueMarkerIcon}>
      <Popup closeButton={false}>
        <VenueMapPopup venue={venue} />
      </Popup>
    </Marker>
  );
}
