import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UserLocation } from "@/types/location";
import type { VenueSortOption } from "@/types/sort";

const SORT_OPTIONS: { label: string; value: VenueSortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Highest rated", value: "rating" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Distance", value: "nearest" },
];

export function SortSelect({
  value,
  userLocation,
  inline = false,
  onChange,
}: {
  value: VenueSortOption;
  userLocation?: UserLocation | null;
  inline?: boolean;
  onChange: (value: VenueSortOption) => void;
}) {
  return (
    <div className={cn(inline ? "flex items-center gap-1.5" : "space-y-1.5")}>
      <label className={cn("font-medium text-nokta-ink-muted", inline ? "text-[13px]" : "text-xs")} htmlFor="sort-filter">
        Sort{inline ? ":" : ""}
      </label>
      <Select
        id="sort-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as VenueSortOption)}
        options={SORT_OPTIONS.map((option) => ({
          ...option,
          label: option.value === "nearest" && !userLocation && !inline ? "Distance - set location first" : option.label,
        }))}
        // No minimum width inline: `min-w-28` held the trigger at 112px, so "Distance" and
        // "Recommended" took the same room as "Price: low to high" and left a gap before the
        // chevron. Let it size to whichever label is selected, as the city chip does.
        className={cn(inline ? "h-8 w-auto gap-1 border-0 bg-transparent px-0 text-[13px] font-semibold text-nokta-ink shadow-none focus-visible:ring-0" : "w-full")}
      />
      {!inline && value === "nearest" && !userLocation ? (
        <p className="text-xs text-muted-foreground">Use my location to sort by nearest.</p>
      ) : null}
    </div>
  );
}
