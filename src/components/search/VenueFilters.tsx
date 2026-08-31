import { useEffect, useRef, useState } from "react";
import { PRICE_OPTIONS, hasActiveFilters } from "@/lib/venueFilters";
import { CitySelector } from "@/components/search/CitySelector";
import { FeatureFilter } from "@/components/search/FeatureFilter";
import { VibeFilter } from "@/components/search/VibeFilter";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { venueCategories } from "@/data/venueCategories";
import type { VenueFilterState } from "@/types/filters";
import type { Venue } from "@/types/venue";

export function VenueFilters({
  venues,
  filters,
  onChange,
  onClear,
  className,
}: {
  venues: Venue[];
  filters: VenueFilterState;
  onChange: (filters: VenueFilterState) => void;
  onClear: () => void;
  className?: string;
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const areas = Array.from(new Set(venues.filter((venue) => venue.country === filters.country && venue.city === filters.city).map((venue) => venue.area))).sort(
    (first, second) => first.localeCompare(second),
  );
  const areaOptions = [{ label: "All areas", value: "all" }, ...areas.map((area) => ({ label: area, value: area }))];
  const selectedCategories = venueCategories.filter((category) => filters.primaryCategories.includes(category.id));

  useEffect(() => {
    if (!categoryOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!categoryRef.current?.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoryOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryOpen]);

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="city-filter">
            City
          </label>
          <CitySelector value={filters.city} onChange={(city) => onChange({ ...filters, city, area: "all" })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="area-filter">
            Area
          </label>
          <Select
            id="area-filter"
            aria-label="Area"
            value={filters.area}
            onChange={(event) => onChange({ ...filters, area: event.target.value })}
            options={areaOptions}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="price-filter">
            Price
          </label>
          <Select
            id="price-filter"
            aria-label="Price"
            value={String(filters.priceLevel)}
            onChange={(event) =>
              onChange({
                ...filters,
                priceLevel: event.target.value === "all" ? "all" : (Number(event.target.value) as VenueFilterState["priceLevel"]),
              })
            }
            options={[...PRICE_OPTIONS]}
            className="w-full"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="category-filter-button">
            Venue type
          </label>
          <div ref={categoryRef} className="relative">
            <button
              id="category-filter-button"
              type="button"
              aria-expanded={categoryOpen}
              className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-nokta-border-input bg-white px-3 py-2 text-left text-sm text-nokta-ink-muted"
              onClick={() => setCategoryOpen((open) => !open)}
            >
              <span className="flex min-w-0 flex-wrap gap-1.5">
                {selectedCategories.length ? (
                  selectedCategories.map((category) => (
                    <span key={category.id} className="inline-flex items-center gap-1 rounded-md bg-nokta-accent-tint px-2 py-1 text-xs font-semibold text-nokta-accent-dark">
                      {category.label}
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-full hover:bg-white/50"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onChange({ ...filters, primaryCategories: filters.primaryCategories.filter((value) => value !== category.id) });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onChange({ ...filters, primaryCategories: filters.primaryCategories.filter((value) => value !== category.id) });
                          }
                        }}
                        aria-label={`Remove ${category.label}`}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </span>
                  ))
                ) : (
                  <span>All venue types</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
            {categoryOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-[1500] rounded-xl border border-nokta-border bg-white p-1.5 shadow-xl shadow-stone-950/10">
                {venueCategories.map((category) => {
                  const selected = filters.primaryCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-nokta-ink-subtle hover:bg-nokta-ink/5"
                      onClick={() =>
                        onChange({
                          ...filters,
                          primaryCategories: selected ? filters.primaryCategories.filter((value) => value !== category.id) : [...filters.primaryCategories, category.id],
                        })
                      }
                    >
                      <span>
                        <span className="block font-medium text-nokta-ink">{category.label}</span>
                        <span className="block text-xs text-nokta-ink-muted">{category.isActive ? "Available now" : "Coming soon"}</span>
                      </span>
                      {selected ? <Check className="h-4 w-4 text-clay-accent" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Separator className="my-5" />
      <VibeFilter value={filters.vibes} onChange={(vibes) => onChange({ ...filters, vibes })} />
      <Separator className="my-5" />
      <FeatureFilter value={filters.features} onChange={(features) => onChange({ ...filters, features })} />
      <div className="mt-6">
        <Button variant="outline" onClick={onClear} disabled={!hasActiveFilters(filters)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
