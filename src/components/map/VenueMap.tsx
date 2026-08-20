import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { VenueMapMarker } from "@/components/map/VenueMapMarker";
import { LONDON_CENTER, hasValidCoordinates } from "@/lib/map";
import type { Venue } from "@/types/venue";

export function VenueMap({ venues, onClearFilters }: { venues: Venue[]; onClearFilters?: () => void }) {
  const mappableVenues = venues.filter(hasValidCoordinates);

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
        <MapBoundsUpdater venues={mappableVenues} />
        {mappableVenues.map((venue) => (
          <VenueMapMarker key={venue.id} venue={venue} />
        ))}
      </MapContainer>
    </div>
  );
}

function MapBoundsUpdater({ venues }: { venues: Venue[] }) {
  const map = useMap();

  useEffect(() => {
    if (venues.length === 0) {
      map.setView([LONDON_CENTER.latitude, LONDON_CENTER.longitude], 11);
      return;
    }

    const bounds = venues.map((venue) => [venue.latitude, venue.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 13 });
  }, [map, venues]);

  return null;
}
