import L from "leaflet";
import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { VenueMapPopup } from "@/components/map/VenueMapPopup";
import type { Venue } from "@/types/venue";

function getVenueMarkerIcon(selected?: boolean) {
  const size = selected ? 20 : 16;
  const borderWidth = selected ? 3 : 2.5;

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:oklch(0.56 0.13 35);border:${borderWidth}px solid #fff;box-shadow:0 2px ${selected ? 10 : 6}px oklch(0.2 0.02 40 / ${selected ? 0.4 : 0.3});"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size],
  });
}

export function VenueMapMarker({ venue, selected }: { venue: Venue; selected?: boolean }) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
    }
  }, [selected]);

  return (
    <Marker ref={markerRef} position={[venue.latitude, venue.longitude]} icon={getVenueMarkerIcon(selected)}>
      <Popup closeButton={false}>
        <VenueMapPopup venue={venue} />
      </Popup>
    </Marker>
  );
}
