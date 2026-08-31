import { PRICE_OPTIONS, hasActiveFilters } from "@/lib/venueFilters";
import { CitySelector } from "@/components/search/CitySelector";
import { FeatureFilter } from "@/components/search/FeatureFilter";
import { VibeFilter } from "@/components/search/VibeFilter";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { activeVenueCategories } from "@/data/venueCategories";
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
  const areas = Array.from(new Set(venues.filter((venue) => venue.country === filters.country && venue.city === filters.city).map((venue) => venue.area))).sort(
    (first, second) => first.localeCompare(second),
  );
  const areaOptions = [{ label: "All areas", value: "all" }, ...areas.map((area) => ({ label: area, value: area }))];
  const categoryOptions = [{ label: "All venue types", value: "all" }, ...activeVenueCategories.map((category) => ({ label: category.label, value: category.id }))];

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
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="category-filter">
            Venue type
          </label>
          <Select
            id="category-filter"
            aria-label="Venue type"
            value={filters.primaryCategory}
            onChange={(event) => onChange({ ...filters, primaryCategory: event.target.value as VenueFilterState["primaryCategory"] })}
            options={categoryOptions}
            className="w-full"
          />
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
