import { Select } from "@/components/ui/select";
import type { UserLocation } from "@/types/location";
import type { VenueSortOption } from "@/types/sort";

const SORT_OPTIONS: { label: string; value: VenueSortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Highest rated", value: "rating" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Nearest", value: "nearest" },
];

export function SortSelect({
  value,
  userLocation,
  onChange,
}: {
  value: VenueSortOption;
  userLocation?: UserLocation | null;
  onChange: (value: VenueSortOption) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="sort-filter">
        Sort
      </label>
      <Select
        id="sort-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as VenueSortOption)}
        options={SORT_OPTIONS.map((option) => ({
          ...option,
          label: option.value === "nearest" && !userLocation ? "Nearest - use location first" : option.label,
        }))}
        className="w-full sm:w-56"
      />
      {value === "nearest" && !userLocation ? (
        <p className="text-xs text-muted-foreground">Use my location to sort by nearest.</p>
      ) : null}
    </div>
  );
}
