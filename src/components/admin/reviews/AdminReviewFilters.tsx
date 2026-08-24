import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReviewStatus } from "@/types/reviews";

export type AdminReviewStatusFilter = "all" | ReviewStatus;

export function AdminReviewFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
}: {
  query: string;
  status: AdminReviewStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: AdminReviewStatusFilter) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search reviews, venue names or user IDs"
        aria-label="Search reviews"
      />
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as AdminReviewStatusFilter)}
        aria-label="Filter by review status"
        options={[
          { label: "All statuses", value: "all" },
          { label: "Published", value: "published" },
          { label: "Hidden", value: "hidden" },
          { label: "Flagged", value: "flagged" },
          { label: "Deleted", value: "deleted" },
        ]}
      />
    </div>
  );
}
