import { PRICE_OPTIONS, hasActiveFilters } from "@/lib/venueFilters";
import { FeatureFilter } from "@/components/search/FeatureFilter";
import { VibeFilter } from "@/components/search/VibeFilter";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  const areas = Array.from(new Set(venues.map((venue) => venue.area))).sort((first, second) => first.localeCompare(second));
  const areaOptions = [{ label: "All areas", value: "all" }, ...areas.map((area) => ({ label: area, value: area }))];

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
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
