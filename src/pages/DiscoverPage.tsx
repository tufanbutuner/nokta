import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DiscoverViewToggle } from "@/components/discover/DiscoverViewToggle";
import { SortSelect } from "@/components/discover/SortSelect";
import { PageContainer } from "@/components/layout/PageContainer";
import { LocationStatusMessage } from "@/components/location/LocationStatusMessage";
import { UseLocationButton } from "@/components/location/UseLocationButton";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueMapResultList } from "@/components/map/VenueMapResultList";
import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { useVenues } from "@/hooks/useVenues";
import { filterVenues } from "@/lib/filterVenues";
import { sortVenues } from "@/lib/sortVenues";
import { filtersToSearchParams, parseDiscoverView, parseVenueFilters, parseVenueSort } from "@/lib/venueFilters";
import type { DiscoverView, VenueFilterState } from "@/types/filters";
import type { LocationStatus, UserLocation } from "@/types/location";
import type { VenueSortOption } from "@/types/sort";

export function DiscoverPage() {
  const { venues, isLoading, error } = useVenues();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const filters = useMemo(() => parseVenueFilters(searchParams), [searchParams]);
  const view = parseDiscoverView(searchParams);
  const sortOption = parseVenueSort(searchParams);
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [venues, filters]);
  const sortedVenues = useMemo(() => sortVenues(filteredVenues, sortOption, userLocation), [filteredVenues, sortOption, userLocation]);
  const resultLabel =
    sortedVenues.length === 0 ? "No venues found" : sortedVenues.length === 1 ? "1 venue found" : `${sortedVenues.length} venues found`;

  useEffect(() => {
    if (sortedVenues.length === 0) {
      setSelectedVenueId(undefined);
      return;
    }

    if (!selectedVenueId || !sortedVenues.some((venue) => venue.id === selectedVenueId)) {
      setSelectedVenueId(sortedVenues[0].id);
    }
  }, [sortedVenues, selectedVenueId]);

  function updateFilters(nextFilters: VenueFilterState) {
    setSearchParams(withDiscoverState(filtersToSearchParams(nextFilters), view, sortOption), { replace: true });
  }

  function clearFilters() {
    setSearchParams(withDiscoverState(new URLSearchParams(), view, sortOption), { replace: true });
  }

  function updateView(nextView: DiscoverView) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextView === "list") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", nextView);
    }
    setSearchParams(nextParams, { replace: true });
  }

  function updateSort(nextSort: VenueSortOption) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextSort === "recommended") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextSort);
    }
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Discover sheesha in London</h1>
            <p className="mt-2 text-muted-foreground">Image-led venue discovery with just enough detail to choose well.</p>
          </div>
          <span className="text-sm text-muted-foreground">{resultLabel}</span>
        </div>

        <div className="mb-8 rounded-lg border bg-card p-3 sm:p-4">
          <div className="grid gap-3">
            <VenueSearch value={filters.query} onChange={(query) => updateFilters({ ...filters, query })} />
            <div className="flex flex-col gap-3 rounded-md border bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">View</p>
                <p className="text-xs text-muted-foreground">Switch between venue cards and the London map.</p>
              </div>
              <DiscoverViewToggle value={view} onChange={updateView} />
            </div>
            <div className="grid gap-3 rounded-md border bg-background/60 p-3 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="flex flex-col gap-3 sm:flex-row">
                <UseLocationButton status={locationStatus} onLocationFound={setUserLocation} onStatusChange={setLocationStatus} />
                <SortSelect value={sortOption} userLocation={userLocation} onChange={updateSort} />
              </div>
              <LocationStatusMessage status={locationStatus} />
            </div>
            <MobileFilterSheet
              venues={venues}
              filters={filters}
              onChange={updateFilters}
              onClear={clearFilters}
              resultCount={filteredVenues.length}
            />
            <VenueFilters venues={venues} filters={filters} onChange={updateFilters} onClear={clearFilters} className="hidden sm:block" />
          </div>
        </div>

        {isLoading ? <LoadingState /> : error ? <ErrorState message={error} /> : null}

        {!isLoading && !error ? (
          <>
            <div className="mb-5 text-sm text-muted-foreground">{resultLabel}</div>

            {view === "list" ? (
              sortedVenues.length ? (
                <VenueGrid venues={sortedVenues} userLocation={userLocation} />
              ) : (
                <DiscoverEmptyState onClear={clearFilters} />
              )
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="hidden max-h-[620px] overflow-y-auto pr-2 lg:block">
                  {sortedVenues.length ? (
                    <VenueMapResultList
                      venues={sortedVenues}
                      selectedVenueId={selectedVenueId}
                      userLocation={userLocation}
                      onSelectVenue={(venue) => setSelectedVenueId(venue.id)}
                    />
                  ) : (
                    <DiscoverEmptyState onClear={clearFilters} compact />
                  )}
                </div>
                <VenueMap venues={sortedVenues} selectedVenueId={selectedVenueId} userLocation={userLocation} onClearFilters={clearFilters} />
              </div>
            )}
          </>
        ) : null}
      </PageContainer>
    </main>
  );
}

function DiscoverEmptyState({ onClear, compact = false }: { onClear: () => void; compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h2 className={compact ? "text-xl font-semibold" : "text-2xl font-semibold"}>No venues found</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">Try removing some filters or searching for another area.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onClear}>Clear filters</Button>
        <Button asChild variant="outline">
          <Link reloadDocument to="/recommend">
            Try recommendations
          </Link>
        </Button>
      </div>
    </div>
  );
}

function withDiscoverState(params: URLSearchParams, view: DiscoverView, sortOption: VenueSortOption) {
  if (view === "map") {
    params.set("view", "map");
  } else {
    params.delete("view");
  }

  if (sortOption === "recommended") {
    params.delete("sort");
  } else {
    params.set("sort", sortOption);
  }

  return params;
}
