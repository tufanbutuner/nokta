import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/state/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_CITY, getActiveCities } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { formatVibe, hasActiveFilters } from "@/lib/venueFilters";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import type { VenueFilterState } from "@/types/filters";

export function DiscoveryFilterChips({
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
  // A search spans every city, so the city control would claim a narrowing that is not applied.
  const isSearching = Boolean(filters.query.trim());

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* City comes first and always shows its value: results are filtered by it from the
          moment the page loads, and leaving that only in the Filters panel made the default
          look like "everywhere" when it was really London. */}
      <CityChip city={filters.city} disabled={isSearching} onChange={(city) => onChange({ ...filters, city, area: "all" })} />
      <FilterChip active={filters.openNow} label="Open now" onClick={() => onChange({ ...filters, openNow: !filters.openNow })} />
      <FilterChip active={filters.priceLevel === 1} label="£ Budget" onClick={() => onChange({ ...filters, priceLevel: filters.priceLevel === 1 ? "all" : 1 })} />
      <FilterChip active={filters.minRating === 4} label="Rating 4+" onClick={() => onChange({ ...filters, minRating: filters.minRating === 4 ? "all" : 4 })} />
      <FilterChip active={filters.features.outdoor} label="Outdoor" onClick={() => onChange({ ...filters, features: { ...filters.features, outdoor: !filters.features.outdoor } })} />
      <FilterChip active={filters.features.food} label="Food menu" onClick={() => onChange({ ...filters, features: { ...filters.features, food: !filters.features.food } })} />
      <FilterChip active={filters.features.openLate} label="Late night" onClick={() => onChange({ ...filters, features: { ...filters.features, openLate: !filters.features.openLate } })} />
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

export function ActiveFilterChips({ filters, onClear }: { filters: VenueFilterState; onClear: () => void }) {
  // A search runs across every city, so the city and area chips would claim a narrowing that
  // is not being applied.
  const isSearching = Boolean(filters.query.trim());
  const showChips = filters.query.trim() || filters.city !== DEFAULT_CITY || filters.area !== "all" || filters.primaryCategories.length || filters.vibes.length;

  if (!showChips) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.query.trim() ? <ActiveFilterBadge>Search: {filters.query.trim()}</ActiveFilterBadge> : null}
      {isSearching ? <ActiveFilterBadge>All cities</ActiveFilterBadge> : null}
      {!isSearching && filters.city !== DEFAULT_CITY ? <ActiveFilterBadge>{filters.city}</ActiveFilterBadge> : null}
      {!isSearching && filters.area !== "all" ? <ActiveFilterBadge>{filters.area}</ActiveFilterBadge> : null}
      {filters.primaryCategories.map((category) => (
        <ActiveFilterBadge key={category}>{formatVenuePrimaryCategory(category)}</ActiveFilterBadge>
      ))}
      {filters.vibes.map((vibe) => (
        <ActiveFilterBadge key={vibe}>{formatVibe(vibe)}</ActiveFilterBadge>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-6 rounded-full px-2 text-[11px] font-semibold text-nokta-ink-muted hover:bg-nokta-ink/5 hover:text-nokta-ink">
        Clear all
      </Button>
    </div>
  );
}

export function DiscoverEmptyState({ onClear, compact = false, className }: { onClear: () => void; compact?: boolean; className?: string }) {
  return (
    <EmptyState
      title="No venues found"
      description="Try removing some filters or searching for another area."
      className={cn("flex flex-col items-center justify-center", compact && "[&_h2]:text-xl", className)}
    >
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onClear}>Clear filters</Button>
        <Button asChild variant="outline">
          <Link to="/recommend">Try recommendations</Link>
        </Button>
      </div>
    </EmptyState>
  );
}

export function hasActiveAdvancedFilters(filters: VenueFilterState) {
  return hasActiveFilters({ ...filters, query: "" });
}

export function getAdvancedFilterCount(filters: VenueFilterState) {
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

/**
 * The city, styled as a chip but backed by a native select so the whole list is reachable in one
 * tap on a phone. It reads as selected because it always is — unlike the other chips, there is
 * no "off" state, so it carries the ink background whatever the value.
 */
function CityChip({ city, disabled, onChange }: { city: string; disabled: boolean; onChange: (city: string) => void }) {
  const cities = getActiveCities();

  return (
    <div className="relative inline-flex">
      <select
        aria-label="City"
        value={city}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full bg-nokta-ink py-0 pl-3 pr-7 text-xs font-semibold text-white transition-colors hover:bg-nokta-ink/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nokta-ink focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title={disabled ? "A search covers every city" : undefined}
      >
        {cities.map((entry) => (
          <option key={entry.slug} value={entry.name}>
            {entry.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white" aria-hidden />
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

function ActiveFilterBadge({ children }: { children: ReactNode }) {
  return <Badge className="h-6 rounded-full border border-nokta-border bg-white px-2 text-[11px] font-medium text-nokta-ink-muted shadow-none">{children}</Badge>;
}
