import { Button } from "@/components/ui/button";
import { FEATURE_OPTIONS } from "@/lib/venueFilters";
import type { FeatureFilterKey, VenueFilterState } from "@/types/filters";

export function FeatureFilter({
  value,
  onChange,
}: {
  value: VenueFilterState["features"];
  onChange: (features: VenueFilterState["features"]) => void;
}) {
  function toggle(feature: FeatureFilterKey) {
    onChange({ ...value, [feature]: !value[feature] });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Features</p>
      <div className="flex flex-wrap gap-2">
        {FEATURE_OPTIONS.map((option) => {
          const selected = value[option.value];
          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              onClick={() => toggle(option.value)}
              aria-pressed={selected}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
