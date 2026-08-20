import { useEffect } from "react";
import type { ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { VenueMapMarker } from "@/components/map/VenueMapMarker";
import { LONDON_CENTER, hasValidCoordinates } from "@/lib/map";
import type { UserLocation } from "@/types/location";
import type { Venue } from "@/types/venue";

const userMarkerIcon = L.divIcon({
  className: "",
  html: '<div class="h-4 w-4 rounded-full border-2 border-card bg-blue-600 shadow-lg shadow-blue-950/30 ring-4 ring-blue-600/20"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

export function VenueMap({
  venues,
  selectedVenueId,
  userLocation,
  onClearFilters,
}: {
  venues: Venue[];
  selectedVenueId?: string;
  userLocation?: UserLocation | null;
  onClearFilters?: () => void;
}) {
  const mappableVenues = venues.filter(hasValidCoordinates);
  const selectedVenue = mappableVenues.find((venue) => venue.id === selectedVenueId);

  if (venues.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border bg-card p-8 text-center md:min-h-[620px]">
        <div>
          <h2 className="text-2xl font-semibold">No venues to show on the map.</h2>
          <p className="mx-auto mt-3 max-w-sm text-muted-foreground">Try clearing some filters.</p>
          {onClearFilters ? (
            <Button className="mt-6" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <MapContainer
        center={[LONDON_CENTER.latitude, LONDON_CENTER.longitude]}
        zoom={11}
        scrollWheelZoom={false}
        className="min-h-[420px] w-full md:min-h-[620px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater venues={mappableVenues} selectedVenue={selectedVenue} userLocation={userLocation} />
        {userLocation ? (
          <VenueMapUserMarker userLocation={userLocation} />
        ) : null}
        {mappableVenues.map((venue) => (
          <VenueMapMarker key={venue.id} venue={venue} selected={venue.id === selectedVenueId} />
        ))}
      </MapContainer>
    </div>
  );
}

function VenueMapUserMarker({ userLocation }: { userLocation: UserLocation }) {
  return (
    <VenueMapMarkerShell position={[userLocation.latitude, userLocation.longitude]}>
      You are here
    </VenueMapMarkerShell>
  );
}

function VenueMapMarkerShell({ position, children }: { position: [number, number]; children: ReactNode }) {
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup closeButton={false}>{children}</Popup>
    </Marker>
  );
}

function MapBoundsUpdater({
  venues,
  selectedVenue,
  userLocation,
}: {
  venues: Venue[];
  selectedVenue?: Venue;
  userLocation?: UserLocation | null;
}) {
  const map = useMap();
  const venuesKey = venues.map((venue) => `${venue.id}:${venue.latitude}:${venue.longitude}`).join("|");
  const selectedVenueKey = selectedVenue ? `${selectedVenue.id}:${selectedVenue.latitude}:${selectedVenue.longitude}` : "";
  const userLocationKey = userLocation ? `${userLocation.latitude}:${userLocation.longitude}` : "";

  useEffect(() => {
    if (selectedVenue) {
      map.flyTo([selectedVenue.latitude, selectedVenue.longitude], 14, { duration: 0.55 });
      return;
    }

    if (venues.length === 0) {
      map.setView([LONDON_CENTER.latitude, LONDON_CENTER.longitude], 11);
      return;
    }

    const bounds = venues.map((venue) => [venue.latitude, venue.longitude] as [number, number]);
    if (userLocation) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 13 });
  }, [map, venuesKey, selectedVenueKey, userLocationKey]);

  return null;
}
