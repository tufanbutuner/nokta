import { useEffect } from "react";
import type { ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { VenueMapMarker } from "@/components/map/VenueMapMarker";
import { DEFAULT_CITY } from "@/lib/cities";
import { getMapCenterForCity, hasValidCoordinates, hasValidUserLocation } from "@/lib/map";
import { cn } from "@/lib/utils";
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
  className,
  city = DEFAULT_CITY,
}: {
  venues: Venue[];
  selectedVenueId?: string;
  userLocation?: UserLocation | null;
  onClearFilters?: () => void;
  className?: string;
  city?: string;
}) {
  const mappableVenues = venues.filter(hasValidCoordinates);
  const selectedVenue = mappableVenues.find((venue) => venue.id === selectedVenueId);
  const mappableUserLocation = hasValidUserLocation(userLocation) ? userLocation : null;
  const cityCenter = getMapCenterForCity(city);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-card", className)}>
      <MapContainer
        center={[cityCenter.latitude, cityCenter.longitude]}
        zoom={cityCenter.defaultZoom}
        scrollWheelZoom={false}
        className="h-full min-h-[420px] w-full md:min-h-[620px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater venues={mappableVenues} selectedVenue={selectedVenue} userLocation={mappableUserLocation} city={city} />
        {mappableUserLocation ? (
          <VenueMapUserMarker userLocation={mappableUserLocation} />
        ) : null}
        {mappableVenues.map((venue) => (
          <VenueMapMarker key={venue.id} venue={venue} selected={venue.id === selectedVenueId} />
        ))}
      </MapContainer>
      {venues.length === 0 ? (
        <div className="absolute inset-x-4 top-4 z-[500] rounded-xl border bg-card/95 p-4 text-sm shadow-lg shadow-stone-950/10 backdrop-blur">
          <h2 className="font-semibold">No venues to show on the map.</h2>
          <p className="mt-1 text-muted-foreground">Try clearing some filters or choosing another city.</p>
          {onClearFilters ? (
            <Button className="mt-3" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
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
  city,
}: {
  venues: Venue[];
  selectedVenue?: Venue;
  userLocation?: UserLocation | null;
  city: string;
}) {
  const map = useMap();
  const cityCenter = getMapCenterForCity(city);
  const venuesKey = venues.map((venue) => `${venue.id}:${venue.latitude}:${venue.longitude}`).join("|");
  const selectedVenueKey = selectedVenue ? `${selectedVenue.id}:${selectedVenue.latitude}:${selectedVenue.longitude}` : "";
  const userLocationKey = userLocation ? `${userLocation.latitude}:${userLocation.longitude}` : "";

  useEffect(() => {
    if (selectedVenue) {
      map.flyTo([selectedVenue.latitude, selectedVenue.longitude], 14, { duration: 0.55 });
      return;
    }

    if (venues.length === 0) {
      map.setView([cityCenter.latitude, cityCenter.longitude], cityCenter.defaultZoom);
      return;
    }

    const bounds = venues.map((venue) => [venue.latitude, venue.longitude] as [number, number]);
    if (userLocation) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 13 });
  }, [map, venuesKey, selectedVenueKey, userLocationKey, cityCenter.latitude, cityCenter.longitude, cityCenter.defaultZoom]);

  return null;
}
