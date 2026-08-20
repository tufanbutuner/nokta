import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { venues } from "@/data/venues";
import { filterVenues } from "@/lib/filterVenues";
import { filtersToSearchParams, parseVenueFilters } from "@/lib/venueFilters";
import type { VenueFilterState } from "@/types/filters";

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseVenueFilters(searchParams), [searchParams]);
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [filters]);
  const resultLabel =
    filteredVenues.length === 0 ? "No venues found" : filteredVenues.length === 1 ? "1 venue found" : `${filteredVenues.length} venues found`;

  function updateFilters(nextFilters: VenueFilterState) {
    setSearchParams(filtersToSearchParams(nextFilters), { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Discover shisha in London</h1>
            <p className="mt-2 text-muted-foreground">Image-led venue discovery with just enough detail to choose well.</p>
          </div>
          <span className="text-sm text-muted-foreground">{resultLabel}</span>
        </div>

        <div className="mb-8 rounded-lg border bg-card p-3 sm:p-4">
          <div className="grid gap-3">
            <VenueSearch value={filters.query} onChange={(query) => updateFilters({ ...filters, query })} />
            <MobileFilterSheet filters={filters} onChange={updateFilters} onClear={clearFilters} resultCount={filteredVenues.length} />
            <VenueFilters filters={filters} onChange={updateFilters} onClear={clearFilters} className="hidden sm:block" />
          </div>
        </div>

        <div className="mb-5 text-sm text-muted-foreground">{resultLabel}</div>

        {filteredVenues.length ? (
          <VenueGrid venues={filteredVenues} />
        ) : (
          <div className="rounded-lg border bg-card p-10 text-center">
            <h2 className="text-2xl font-semibold">No venues found</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">Try removing some filters or searching for another area.</p>
            <Button className="mt-6" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
