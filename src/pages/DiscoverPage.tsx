import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DiscoverViewToggle } from "@/components/discover/DiscoverViewToggle";
import { PageContainer } from "@/components/layout/PageContainer";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueMapResultList } from "@/components/map/VenueMapResultList";
import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { venues } from "@/data/venues";
import { filterVenues } from "@/lib/filterVenues";
import { filtersToSearchParams, parseDiscoverView, parseVenueFilters } from "@/lib/venueFilters";
import type { DiscoverView, VenueFilterState } from "@/types/filters";

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const filters = useMemo(() => parseVenueFilters(searchParams), [searchParams]);
  const view = parseDiscoverView(searchParams);
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [filters]);
  const resultLabel =
    filteredVenues.length === 0 ? "No venues found" : filteredVenues.length === 1 ? "1 venue found" : `${filteredVenues.length} venues found`;

  useEffect(() => {
    if (filteredVenues.length === 0) {
      setSelectedVenueId(undefined);
      return;
    }

    if (!selectedVenueId || !filteredVenues.some((venue) => venue.id === selectedVenueId)) {
      setSelectedVenueId(filteredVenues[0].id);
    }
  }, [filteredVenues, selectedVenueId]);

  function updateFilters(nextFilters: VenueFilterState) {
    setSearchParams(withView(filtersToSearchParams(nextFilters), view), { replace: true });
  }

  function clearFilters() {
    setSearchParams(withView(new URLSearchParams(), view), { replace: true });
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

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Discover shisha in London</h1>
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
            <MobileFilterSheet filters={filters} onChange={updateFilters} onClear={clearFilters} resultCount={filteredVenues.length} />
            <VenueFilters filters={filters} onChange={updateFilters} onClear={clearFilters} className="hidden sm:block" />
          </div>
        </div>

        <div className="mb-5 text-sm text-muted-foreground">{resultLabel}</div>

        {view === "list" ? (
          filteredVenues.length ? (
            <VenueGrid venues={filteredVenues} />
          ) : (
            <DiscoverEmptyState onClear={clearFilters} />
          )
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="hidden max-h-[620px] overflow-y-auto pr-2 lg:block">
              {filteredVenues.length ? (
                <VenueMapResultList
                  venues={filteredVenues}
                  selectedVenueId={selectedVenueId}
                  onSelectVenue={(venue) => setSelectedVenueId(venue.id)}
                />
              ) : (
                <DiscoverEmptyState onClear={clearFilters} compact />
              )}
            </div>
            <VenueMap venues={filteredVenues} selectedVenueId={selectedVenueId} onClearFilters={clearFilters} />
          </div>
        )}
      </PageContainer>
    </main>
  );
}

function DiscoverEmptyState({ onClear, compact = false }: { onClear: () => void; compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h2 className={compact ? "text-xl font-semibold" : "text-2xl font-semibold"}>No venues found</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">Try removing some filters or searching for another area.</p>
      <Button className="mt-6" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

function withView(params: URLSearchParams, view: DiscoverView) {
  if (view === "map") {
    params.set("view", "map");
  } else {
    params.delete("view");
  }
  return params;
}
