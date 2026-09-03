import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/state/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_CITY } from "@/lib/cities";
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
  return (
    <div className="flex flex-wrap gap-1.5">
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
  const showChips = filters.query.trim() || filters.city !== DEFAULT_CITY || filters.area !== "all" || filters.primaryCategories.length || filters.vibes.length;

  if (!showChips) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.query.trim() ? <ActiveFilterBadge>Search: {filters.query.trim()}</ActiveFilterBadge> : null}
      {filters.city !== DEFAULT_CITY ? <ActiveFilterBadge>{filters.city}</ActiveFilterBadge> : null}
      {filters.area !== "all" ? <ActiveFilterBadge>{filters.area}</ActiveFilterBadge> : null}
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
