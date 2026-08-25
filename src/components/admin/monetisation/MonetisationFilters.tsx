import { cn } from "@/lib/utils";

export type MonetisationFilter = "all" | "claimed" | "in-pipeline" | "paying" | "featured-eligible" | "not-contacted" | "churned";

const FILTER_OPTIONS: { label: string; value: MonetisationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Claimed", value: "claimed" },
  { label: "In Pipeline", value: "in-pipeline" },
  { label: "Paying", value: "paying" },
  { label: "Featured Eligible", value: "featured-eligible" },
  { label: "Not Contacted", value: "not-contacted" },
  { label: "Churned", value: "churned" },
];

export function MonetisationFilters({
  activeFilter,
  onChange,
}: {
  activeFilter: MonetisationFilter;
  onChange: (filter: MonetisationFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = option.value === activeFilter;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded-full px-3.5 py-1.5 font-['Outfit'] text-[11px] font-medium transition-colors",
              isActive
                ? "bg-clay-600 text-clay-50"
                : "border border-black/[0.04] bg-white text-[#8a7e72] hover:border-clay-400/20 hover:text-clay-600",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
