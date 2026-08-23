import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { SortSelect } from "@/components/discover/SortSelect";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueMapResultList } from "@/components/map/VenueMapResultList";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenues } from "@/hooks/useVenues";
import { filterVenues } from "@/lib/filterVenues";
import { getVenueCurrentStatus, isVenueOpenNow } from "@/lib/openingHours";
import { sortVenues } from "@/lib/sortVenues";
import { cn } from "@/lib/utils";
import {
  filtersToSearchParams,
  formatVibe,
  hasActiveFilters,
  parseDiscoverView,
  parseVenueFilters,
  parseVenueSort,
} from "@/lib/venueFilters";
import type { DiscoverView, VenueFilterState } from "@/types/filters";
import type { VenueSortOption } from "@/types/sort";

export function DiscoverPage() {
  const { venues, isLoading, error } = useVenues();
  const { userLocation, savedLocation } = useAppLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const filters = useMemo(() => parseVenueFilters(searchParams), [searchParams]);
  const view = parseDiscoverView(searchParams);
  const requestedSortOption = parseVenueSort(searchParams);
  const sortOption = !searchParams.has("sort") && userLocation ? "nearest" : requestedSortOption;
  const filtersAreActive = hasActiveFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(filtersAreActive);
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [venues, filters]);
  const sortedVenues = useMemo(() => sortVenues(filteredVenues, sortOption, userLocation), [filteredVenues, sortOption, userLocation]);
  const resultLabel =
    sortedVenues.length === 0 ? "No venues" : sortedVenues.length === 1 ? "1 venue" : `${sortedVenues.length} venues`;
  const resultContextLabel = savedLocation ? `${resultLabel} near ${savedLocation.label}` : resultLabel;
  const venueStatusCounts = sortedVenues.reduce(
    (counts, venue) => {
      const currentStatus = getVenueCurrentStatus(venue);
      counts[currentStatus] += 1;
      return counts;
    },
    { open: 0, closed: 0, unknown: 0 },
  );
  const statusCountLabel = [
    `${venueStatusCounts.open} open`,
    `${venueStatusCounts.closed} closed`,
    venueStatusCounts.unknown ? `${venueStatusCounts.unknown} TBC` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .join(" · ");

  useEffect(() => {
    if (sortedVenues.length === 0) {
      setSelectedVenueId(undefined);
      return;
    }

    if (!selectedVenueId || !sortedVenues.some((venue) => venue.id === selectedVenueId)) {
      setSelectedVenueId(sortedVenues[0].id);
    }
  }, [sortedVenues, selectedVenueId]);

  useEffect(() => {
    if (filtersAreActive) {
      setFiltersOpen(true);
    }
  }, [filtersAreActive]);

  useEffect(() => {
    if (!userLocation || searchParams.has("sort")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", "nearest");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, userLocation]);

  function updateFilters(nextFilters: VenueFilterState) {
    setSearchParams(withDiscoverState(filtersToSearchParams(nextFilters), view, requestedSortOption, searchParams.has("sort")), { replace: true });
  }

  function clearFilters() {
    setSearchParams(withDiscoverState(new URLSearchParams(), view, requestedSortOption, searchParams.has("sort")), { replace: true });
  }

  function updateSort(nextSort: VenueSortOption) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", nextSort);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <main className="bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-none flex-col px-3 py-3 lg:h-[calc(100vh-4rem)]">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl shadow-stone-950/5">
            <div className="space-y-3 border-b p-4">
              <VenueSearch value={filters.query} onChange={(query) => updateFilters({ ...filters, query })} />

              <DiscoveryFilterChips
                filters={filters}
                filtersOpen={filtersOpen}
                onChange={updateFilters}
                onToggleFilters={() => setFiltersOpen((open) => !open)}
              />

              <ActiveFilterChips filters={filters} onClear={clearFilters} />

              {filtersOpen ? (
                <div className="rounded-xl border bg-background/50 p-3">
                  <VenueFilters venues={venues} filters={filters} onChange={updateFilters} onClear={clearFilters} />
                </div>
              ) : null}
            </div>

            <div className="space-y-2 border-b bg-background/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <p className="font-medium">{resultContextLabel}</p>
                  <span className="text-muted-foreground">·</span>
                  <SortSelect value={sortOption} userLocation={userLocation} onChange={updateSort} inline />
                </div>
                {filtersAreActive ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {savedLocation ? "Tap a venue to focus it on the map." : "Set your location in the navbar for nearest sorting."}
              </p>
            </div>

            <div className={cn("min-h-[420px] flex-1 overflow-y-auto p-3", view === "map" ? "hidden lg:block" : "block lg:hidden")}>
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} />
              ) : sortedVenues.length ? (
                <VenueMapResultList
                  venues={sortedVenues}
                  selectedVenueId={selectedVenueId}
                  userLocation={userLocation}
                  onSelectVenue={(venue) => setSelectedVenueId(venue.id)}
                />
              ) : (
                <DiscoverEmptyState onClear={clearFilters} compact className="h-full min-h-[360px]" />
              )}
            </div>
          </aside>

          <section className={cn("min-h-[560px] overflow-hidden rounded-2xl border bg-card shadow-xl shadow-stone-950/5 lg:min-h-0", view === "list" && "hidden lg:block")}>
            {isLoading ? (
              <div className="flex h-full min-h-[560px] items-center justify-center">
                <LoadingState />
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[560px] items-center justify-center p-6">
                <ErrorState message={error} />
              </div>
            ) : view === "map" ? (
              <div className="relative h-full min-h-[560px]">
                <VenueMap
                  venues={sortedVenues}
                  selectedVenueId={selectedVenueId}
                  userLocation={userLocation}
                  onClearFilters={clearFilters}
                  className="h-full rounded-none border-0"
                />
                <div className="absolute bottom-4 left-4 rounded-full border bg-card/90 px-3 py-2 text-xs font-medium shadow-lg shadow-stone-950/10 backdrop-blur">
                  {statusCountLabel}
                </div>
              </div>
            ) : sortedVenues.length ? (
              <div className="h-full overflow-y-auto p-5">
                <VenueGrid venues={sortedVenues} userLocation={userLocation} />
              </div>
            ) : (
              <DiscoverEmptyState onClear={clearFilters} className="h-full min-h-[560px]" />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function DiscoveryFilterChips({
  filters,
  filtersOpen,
  onChange,
  onToggleFilters,
}: {
  filters: VenueFilterState;
  filtersOpen: boolean;
  onChange: (filters: VenueFilterState) => void;
  onToggleFilters: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <FilterChip active={filters.openNow} label="Open now" onClick={() => onChange({ ...filters, openNow: !filters.openNow })} />
      <FilterChip
        active={filters.priceLevel === 1}
        label="£ Budget"
        onClick={() => onChange({ ...filters, priceLevel: filters.priceLevel === 1 ? "all" : 1 })}
      />
      <FilterChip
        active={filters.minRating === 4}
        label="Rating 4+"
        onClick={() => onChange({ ...filters, minRating: filters.minRating === 4 ? "all" : 4 })}
      />
      <FilterChip
        active={filters.features.outdoor}
        label="Outdoor"
        onClick={() => onChange({ ...filters, features: { ...filters.features, outdoor: !filters.features.outdoor } })}
      />
      <FilterChip
        active={filters.features.food}
        label="Food menu"
        onClick={() => onChange({ ...filters, features: { ...filters.features, food: !filters.features.food } })}
      />
      <FilterChip
        active={filters.features.openLate}
        label="Late night"
        onClick={() => onChange({ ...filters, features: { ...filters.features, openLate: !filters.features.openLate } })}
      />
      <button
        type="button"
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
          filtersOpen ? "bg-foreground text-background hover:bg-foreground/90" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        More
      </button>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
        active ? "bg-clay-accent/10 text-clay-accent hover:bg-clay-accent/15" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
      )}
    >
      {label}
      {active ? <X className="h-3 w-3" /> : null}
    </button>
  );
}

function ActiveFilterChips({
  filters,
  onClear,
}: {
  filters: VenueFilterState;
  onClear: () => void;
}) {
  const showChips = filters.query.trim() || filters.area !== "all" || filters.vibes.length;

  if (!showChips) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.query.trim() ? <Badge className="bg-clay-accent/10 text-clay-accent">Search: {filters.query.trim()}</Badge> : null}
      {filters.area !== "all" ? <Badge className="bg-clay-accent/10 text-clay-accent">{filters.area}</Badge> : null}
      {filters.vibes.map((vibe) => (
        <Badge key={vibe} className="bg-clay-accent/10 text-clay-accent">
          {formatVibe(vibe)}
        </Badge>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-7 rounded-full px-2 text-xs">
        Clear all
      </Button>
    </div>
  );
}

function DiscoverEmptyState({ onClear, compact = false, className }: { onClear: () => void; compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border bg-card p-10 text-center", className)}>
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

function withDiscoverState(params: URLSearchParams, view: DiscoverView, sortOption: VenueSortOption, hasExplicitSort: boolean) {
  if (view === "list") {
    params.set("view", "list");
  } else {
    params.delete("view");
  }

  if (!hasExplicitSort) {
    params.delete("sort");
  } else {
    params.set("sort", sortOption);
  }

  return params;
}
