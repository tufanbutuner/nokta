import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { SortSelect } from "@/components/discover/SortSelect";
import { DiscoverFeaturedVenues } from "@/components/featured/DiscoverFeaturedVenues";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueMapResultList } from "@/components/map/VenueMapResultList";
import { PageMeta } from "@/components/seo/PageMeta";
import { VenueFilters } from "@/components/search/VenueFilters";
import { VenueSearch } from "@/components/search/VenueSearch";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppLocation } from "@/context/AppLocationContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useVenueReviewSummaries } from "@/hooks/useVenueReviewSummaries";
import { useVenues } from "@/hooks/useVenues";
import { filterVenues } from "@/lib/filterVenues";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_CITY } from "@/lib/cities";
import { brandConfig } from "@/config/brand";
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
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import type { DiscoverView, VenueFilterState } from "@/types/filters";
import type { VenueSortOption } from "@/types/sort";

export function DiscoverPage() {
  const { venues, isLoading, error } = useVenues();
  const { userLocation, savedLocation } = useAppLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const filters = useMemo(() => parseVenueFilters(searchParams), [searchParams]);
  const view = parseDiscoverView(searchParams);
  const requestedSortOption = parseVenueSort(searchParams);
  const sortOption = !searchParams.has("sort") && userLocation ? "nearest" : requestedSortOption;
  const filtersAreActive = hasActiveFilters(filters);
  const advancedFiltersAreActive = hasActiveAdvancedFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(advancedFiltersAreActive);
  const showDesktopMapArea = useMediaQuery("(min-width: 1024px)");
  const filteredVenues = useMemo(() => filterVenues(venues, filters), [venues, filters]);
  const sortedVenues = useMemo(() => sortVenues(filteredVenues, sortOption, userLocation), [filteredVenues, sortOption, userLocation]);
  const venueIds = useMemo(() => sortedVenues.map((venue) => venue.id), [sortedVenues]);
  const { summaries: reviewSummaries } = useVenueReviewSummaries(venueIds);
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
    if (advancedFiltersAreActive) {
      setFiltersOpen(true);
    }
  }, [advancedFiltersAreActive]);

  useEffect(() => {
    if (!userLocation || searchParams.has("sort")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", "nearest");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, userLocation]);

  function updateFilters(nextFilters: VenueFilterState) {
    trackDiscoverFilterChange(filters, nextFilters, sortOption, view);
    setSearchParams(withDiscoverState(filtersToSearchParams(nextFilters), view, requestedSortOption, searchParams.has("sort")), { replace: true });
  }

  function clearFilters() {
    setSearchParams(withDiscoverState(new URLSearchParams(), view, requestedSortOption, searchParams.has("sort")), { replace: true });
  }

  function updateSort(nextSort: VenueSortOption) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", nextSort);
    trackEvent("discover_filter_changed", getDiscoverAnalyticsProperties(filters, nextSort, view));
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <main className="bg-background">
      <PageMeta
        title={`Discover Venues Near You | ${brandConfig.appName}`}
        description="Explore social venues by city, area and vibe. View photos, venue details, opening info and request bookings."
        canonicalPath="/discover"
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-none flex-col bg-nokta-page-bg px-3 py-3 lg:h-[calc(100vh-4rem)]">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface shadow-[0_12px_30px_-16px_oklch(0.2_0.02_40_/_0.18)]">
            <div className="space-y-3 border-b border-nokta-border p-4">
              <VenueSearch value={filters.query} onChange={(query) => updateFilters({ ...filters, query })} />

              <div className="space-y-2">
                <DiscoveryFilterChips
                  filters={filters}
                  filtersOpen={filtersOpen}
                  activeAdvancedCount={getAdvancedFilterCount(filters)}
                  onChange={updateFilters}
                  onToggleFilters={() => setFiltersOpen((open) => !open)}
                />

                <ActiveFilterChips filters={filters} onClear={clearFilters} />
              </div>

              {filtersOpen ? (
                <div className="rounded-2xl border border-nokta-border bg-nokta-page-bg/45 p-3 shadow-inner shadow-stone-950/[0.02]">
                  <VenueFilters venues={venues} filters={filters} onChange={updateFilters} onClear={clearFilters} />
                </div>
              ) : null}
            </div>

            <div className="border-b border-nokta-border bg-nokta-surface-alt p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                  <p className="min-w-0 truncate text-[13px] font-semibold text-nokta-ink">{resultContextLabel}</p>
                  {showDesktopMapArea && statusCountLabel ? (
                    <>
                      <span className="text-xs text-nokta-ink-muted">·</span>
                      <p className="text-[13px] font-medium text-nokta-ink-muted">{statusCountLabel}</p>
                    </>
                  ) : null}
                  <span className="text-xs text-nokta-ink-muted">·</span>
                  <SortSelect value={sortOption} userLocation={userLocation} onChange={updateSort} inline />
                </div>
                {filtersAreActive ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold text-nokta-ink-muted hover:bg-nokta-ink/5 hover:text-nokta-ink">
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="block min-h-[420px] flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} />
              ) : sortedVenues.length ? (
                <>
                  <DiscoverFeaturedVenues city={filters.city} area={filters.area} venues={sortedVenues} />
                  <VenueMapResultList
                    venues={sortedVenues}
                    selectedVenueId={selectedVenueId}
                    userLocation={userLocation}
                    reviewSummaries={reviewSummaries}
                    onSelectVenue={(venue) => {
                      if (showDesktopMapArea) {
                        setSelectedVenueId(venue.id);
                        return;
                      }

                      navigate(`/venues/${venue.slug}`);
                    }}
                  />
                </>
              ) : (
                <DiscoverEmptyState onClear={clearFilters} compact className="h-full min-h-[360px]" />
              )}
            </div>
          </aside>

          {showDesktopMapArea ? (
            <section className="min-h-[560px] overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface shadow-[0_12px_30px_-16px_oklch(0.2_0.02_40_/_0.18)] lg:min-h-0">
              {isLoading ? (
                <div className="flex h-full min-h-[560px] items-center justify-center">
                  <LoadingState />
                </div>
              ) : error ? (
                <div className="flex h-full min-h-[560px] items-center justify-center p-6">
                  <ErrorState message={error} />
                </div>
              ) : (
                <div className="relative h-full min-h-[560px]">
                  <VenueMap
                    venues={sortedVenues}
                    selectedVenueId={selectedVenueId}
                    userLocation={userLocation}
                    city={filters.city}
                    onClearFilters={clearFilters}
                    className="h-full rounded-none border-0 bg-nokta-surface"
                  />
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function DiscoveryFilterChips({
  filters,
  filtersOpen,
  activeAdvancedCount,
  onChange,
  onToggleFilters,
}: {
  filters: VenueFilterState;
  filtersOpen: boolean;
  activeAdvancedCount: number;
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
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
          filtersOpen ? "bg-nokta-ink text-white hover:bg-nokta-ink/90" : "bg-nokta-ink/5 text-nokta-ink-subtle hover:bg-nokta-ink/10 hover:text-nokta-ink",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeAdvancedCount ? (
          <span className={cn("ml-0.5 rounded-full px-1.5 text-[10px]", filtersOpen ? "bg-white/15 text-white" : "bg-nokta-ink text-white")}>
            {activeAdvancedCount}
          </span>
        ) : null}
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
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
        active ? "bg-nokta-ink text-white hover:bg-nokta-ink/90" : "bg-nokta-ink/5 text-nokta-ink-subtle hover:bg-nokta-ink/10 hover:text-nokta-ink",
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
  const showChips = filters.query.trim() || filters.city !== DEFAULT_CITY || filters.area !== "all" || filters.primaryCategories.length || filters.vibes.length;

  if (!showChips) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.query.trim() ? <ActiveFilterBadge>Search: {filters.query.trim()}</ActiveFilterBadge> : null}
      {filters.city !== DEFAULT_CITY ? <ActiveFilterBadge>{filters.city}</ActiveFilterBadge> : null}
      {filters.area !== "all" ? <ActiveFilterBadge>{filters.area}</ActiveFilterBadge> : null}
      {filters.primaryCategories.map((category) => (
        <ActiveFilterBadge key={category}>
          {formatVenuePrimaryCategory(category)}
        </ActiveFilterBadge>
      ))}
      {filters.vibes.map((vibe) => (
        <ActiveFilterBadge key={vibe}>
          {formatVibe(vibe)}
        </ActiveFilterBadge>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-6 rounded-full px-2 text-[11px] font-semibold text-nokta-ink-muted hover:bg-nokta-ink/5 hover:text-nokta-ink">
        Clear all
      </Button>
    </div>
  );
}

function ActiveFilterBadge({ children }: { children: ReactNode }) {
  return <Badge className="h-6 rounded-full border border-nokta-border bg-white px-2 text-[11px] font-medium text-nokta-ink-muted shadow-none">{children}</Badge>;
}

function DiscoverEmptyState({ onClear, compact = false, className }: { onClear: () => void; compact?: boolean; className?: string }) {
  return (
    <EmptyState
      title="No venues found"
      description="Try removing some filters or searching for another area."
      className={cn("flex flex-col items-center justify-center", compact && "[&_h2]:text-xl", className)}
    >
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onClear}>Clear filters</Button>
        <Button asChild variant="outline">
          <Link reloadDocument to="/recommend">
            Try recommendations
          </Link>
        </Button>
      </div>
    </EmptyState>
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

function trackDiscoverFilterChange(
  currentFilters: VenueFilterState,
  nextFilters: VenueFilterState,
  sortOption: VenueSortOption,
  view: DiscoverView,
) {
  const event = currentFilters.query !== nextFilters.query ? "discover_search_used" : "discover_filter_changed";
  trackEvent(event, getDiscoverAnalyticsProperties(nextFilters, sortOption, view));
}

function getDiscoverAnalyticsProperties(filters: VenueFilterState, sort: VenueSortOption, view: DiscoverView) {
  return {
    query: filters.query.trim() || null,
    country: filters.country,
    city: filters.city,
    area: filters.area,
    categories: filters.primaryCategories.length ? filters.primaryCategories.join(",") : null,
    price: filters.priceLevel === "all" ? null : filters.priceLevel,
    sort,
    view,
  };
}

function hasActiveAdvancedFilters(filters: VenueFilterState) {
  return hasActiveFilters({ ...filters, query: "" });
}

function getAdvancedFilterCount(filters: VenueFilterState) {
  return [
    filters.city !== DEFAULT_CITY,
    filters.area !== "all",
    filters.primaryCategories.length > 0,
    filters.vibes.length > 0,
    filters.priceLevel !== "all",
    filters.minRating !== "all",
    Object.values(filters.features).some(Boolean),
  ].filter(Boolean).length;
}
