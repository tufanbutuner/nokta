import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { DiscoverViewToggle } from "@/components/discover/DiscoverViewToggle";
import { SortSelect } from "@/components/discover/SortSelect";
import { LocationStatusMessage } from "@/components/location/LocationStatusMessage";
import { UseLocationButton } from "@/components/location/UseLocationButton";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueMapResultList } from "@/components/map/VenueMapResultList";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVenues } from "@/hooks/useVenues";
import { filterVenues } from "@/lib/filterVenues";
import { sortVenues } from "@/lib/sortVenues";
import { cn } from "@/lib/utils";
import {
  FEATURE_OPTIONS,
  PRICE_OPTIONS,
  filtersToSearchParams,
  formatVibe,
  hasActiveFilters,
  parseDiscoverView,
  parseVenueFilters,
  parseVenueSort,
} from "@/lib/venueFilters";
import type { DiscoverView, FeatureFilterKey, VenueFilterState } from "@/types/filters";
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
  const filtersAreActive = hasActiveFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(filtersAreActive);
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [venues, filters]);
  const sortedVenues = useMemo(() => sortVenues(filteredVenues, sortOption, userLocation), [filteredVenues, sortOption, userLocation]);
  const resultLabel =
    sortedVenues.length === 0 ? "No venues found" : sortedVenues.length === 1 ? "1 venue found" : `${sortedVenues.length} venues found`;
  const openVenueCount = sortedVenues.filter((venue) => venue.businessStatus === "open" || venue.businessStatus === "unknown").length;
  const closedVenueCount = Math.max(sortedVenues.length - openVenueCount, 0);

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

  function updateFilters(nextFilters: VenueFilterState) {
    setSearchParams(withDiscoverState(filtersToSearchParams(nextFilters), view, sortOption), { replace: true });
  }

  function clearFilters() {
    setSearchParams(withDiscoverState(new URLSearchParams(), view, sortOption), { replace: true });
  }

  function updateView(nextView: DiscoverView) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextView === "map") {
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

  function dismissFeature(feature: FeatureFilterKey) {
    updateFilters({ ...filters, features: { ...filters.features, [feature]: false } });
  }

  return (
    <main className="bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] flex-col gap-4 px-4 py-5 lg:h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay-accent">Discover</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Find sheesha across London</h1>
            <p className="mt-2 text-sm text-muted-foreground">Search, filter, compare, then pick it on the map.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{openVenueCount} open</span>
            <span aria-hidden="true">·</span>
            <span>{closedVenueCount} closed</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl shadow-stone-950/5">
            <div className="space-y-4 border-b p-4">
              <VenueSearch value={filters.query} onChange={(query) => updateFilters({ ...filters, query })} />

              <div className="flex flex-wrap gap-2">
                <QuickFilterChip
                  active={filters.features.openLate}
                  label="Late night"
                  onClick={() => updateFilters({ ...filters, features: { ...filters.features, openLate: !filters.features.openLate } })}
                />
                <QuickFilterChip
                  active={filters.priceLevel === 1}
                  label="£ Budget"
                  onClick={() => updateFilters({ ...filters, priceLevel: filters.priceLevel === 1 ? "all" : 1 })}
                />
                <QuickFilterChip
                  active={filters.features.outdoor}
                  label="Outdoor"
                  onClick={() => updateFilters({ ...filters, features: { ...filters.features, outdoor: !filters.features.outdoor } })}
                />
                <QuickFilterChip
                  active={filters.features.food}
                  label="Food menu"
                  onClick={() => updateFilters({ ...filters, features: { ...filters.features, food: !filters.features.food } })}
                />
              </div>

              <ActiveFilterChips filters={filters} onClear={clearFilters} onDismissFeature={dismissFeature} />

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <DiscoverViewToggle value={view} onChange={updateView} />
                <Button
                  type="button"
                  variant={filtersOpen || filtersAreActive ? "default" : "outline"}
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="w-full sm:w-36"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              {filtersOpen ? (
                <div className="rounded-xl border bg-background/50 p-4">
                  <VenueFilters venues={venues} filters={filters} onChange={updateFilters} onClear={clearFilters} />
                </div>
              ) : null}
            </div>

            <div className="space-y-4 border-b p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{resultLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tap a venue to focus it on the map.</p>
                </div>
                {filtersAreActive ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3">
                <UseLocationButton status={locationStatus} onLocationFound={setUserLocation} onStatusChange={setLocationStatus} />
                <SortSelect value={sortOption} userLocation={userLocation} onChange={updateSort} />
              </div>
              <LocationStatusMessage status={locationStatus} />
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
                  {openVenueCount} open · {closedVenueCount} closed
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

function QuickFilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className={cn("rounded-full", active && "bg-clay-accent text-white hover:bg-clay-accent-hover")}
    >
      {label}
    </Button>
  );
}

function ActiveFilterChips({
  filters,
  onClear,
  onDismissFeature,
}: {
  filters: VenueFilterState;
  onClear: () => void;
  onDismissFeature: (feature: FeatureFilterKey) => void;
}) {
  const activeFeatures = FEATURE_OPTIONS.filter((option) => filters.features[option.value]);
  const priceLabel = PRICE_OPTIONS.find((option) => option.value === String(filters.priceLevel))?.label;
  const showChips = filters.query.trim() || filters.area !== "all" || filters.priceLevel !== "all" || filters.vibes.length || activeFeatures.length;

  if (!showChips) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.query.trim() ? <Badge className="bg-clay-accent/10 text-clay-accent">Search: {filters.query.trim()}</Badge> : null}
      {filters.area !== "all" ? <Badge className="bg-clay-accent/10 text-clay-accent">{filters.area}</Badge> : null}
      {filters.priceLevel !== "all" ? <Badge className="bg-clay-accent/10 text-clay-accent">{priceLabel}</Badge> : null}
      {filters.vibes.map((vibe) => (
        <Badge key={vibe} className="bg-clay-accent/10 text-clay-accent">
          {formatVibe(vibe)}
        </Badge>
      ))}
      {activeFeatures.map((feature) => (
        <button
          key={feature.value}
          type="button"
          onClick={() => onDismissFeature(feature.value)}
          className="inline-flex items-center gap-1 rounded-full bg-clay-accent/10 px-2.5 py-1 text-xs font-medium text-clay-accent"
        >
          {feature.label}
          <X className="h-3 w-3" />
        </button>
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

function withDiscoverState(params: URLSearchParams, view: DiscoverView, sortOption: VenueSortOption) {
  if (view === "list") {
    params.set("view", "list");
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
