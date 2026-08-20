import { Button } from "@/components/ui/button";
import type { DataQualityFilter } from "@/lib/venueQuality";

const FILTER_OPTIONS: { label: string; value: DataQualityFilter }[] = [
  { label: "All venues", value: "all" },
  { label: "Poor quality", value: "poor" },
  { label: "Needs work", value: "needs-work" },
  { label: "Good quality", value: "good" },
  { label: "Missing opening hours", value: "missing-opening-hours" },
  { label: "Missing phone", value: "missing-phone" },
  { label: "Missing price", value: "missing-price" },
  { label: "Missing official source", value: "missing-official-source" },
  { label: "Only third-party sourced", value: "third-party-only" },
  { label: "Questionable coordinates", value: "questionable-coordinates" },
];

export function DataQualityFilters({
  activeFilter,
  onChange,
}: {
  activeFilter: DataQualityFilter;
  onChange: (filter: DataQualityFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={activeFilter === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
