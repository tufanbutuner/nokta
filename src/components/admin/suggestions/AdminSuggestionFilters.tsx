import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { VenueSuggestionStatus } from "@/types/venueSuggestions";

export type AdminSuggestionStatusFilter = "all" | VenueSuggestionStatus;

export function AdminSuggestionFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
}: {
  query: string;
  status: AdminSuggestionStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: AdminSuggestionStatusFilter) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search by venue name, area, address or notes"
        aria-label="Search suggestions"
      />
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as AdminSuggestionStatusFilter)}
        aria-label="Filter suggestions by status"
        options={[
          { label: "All statuses", value: "all" },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
          { label: "Converted", value: "converted" },
        ]}
      />
    </div>
  );
}
