import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FeaturedPlacement, FeaturedPlacementStatus, FeaturedPlacementType } from "@/types/featuredPlacements";

export const FEATURED_PLACEMENT_TYPE_OPTIONS: { label: string; value: FeaturedPlacementType }[] = [
  { label: "Homepage", value: "homepage" },
  { label: "City", value: "city" },
  { label: "Area", value: "area" },
  { label: "Discover", value: "discover" },
  { label: "Recommendation", value: "recommendation" },
];

export const FEATURED_PLACEMENT_STATUS_OPTIONS: { label: string; value: FeaturedPlacementStatus }[] = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

export type FeaturedPlacementStatusFilter = "all" | FeaturedPlacementStatus;
export type FeaturedPlacementTypeFilter = "all" | FeaturedPlacementType;

export function FeaturedPlacementSummaryCards({ placements }: { placements: FeaturedPlacement[] }) {
  const active = placements.filter((placement) => placement.status === "active").length;
  const draft = placements.filter((placement) => placement.status === "draft").length;
  const paused = placements.filter((placement) => placement.status === "paused").length;
  const homepage = placements.filter((placement) => placement.placementType === "homepage").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total placements" value={placements.length} />
      <MetricCard label="Active" value={active} />
      <MetricCard label="Draft" value={draft} />
      <MetricCard label="Homepage" value={homepage + paused} />
    </div>
  );
}

export function FeaturedPlacementFilters({
  query,
  statusFilter,
  typeFilter,
  onQueryChange,
  onStatusFilterChange,
  onTypeFilterChange,
}: {
  query: string;
  statusFilter: FeaturedPlacementStatusFilter;
  typeFilter: FeaturedPlacementTypeFilter;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: FeaturedPlacementStatusFilter) => void;
  onTypeFilterChange: (type: FeaturedPlacementTypeFilter) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
      <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search venue, city, area or placement" />
      <Select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as FeaturedPlacementStatusFilter)} options={[{ label: "All statuses", value: "all" }, ...FEATURED_PLACEMENT_STATUS_OPTIONS]} />
      <Select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as FeaturedPlacementTypeFilter)} options={[{ label: "All types", value: "all" }, ...FEATURED_PLACEMENT_TYPE_OPTIONS]} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
