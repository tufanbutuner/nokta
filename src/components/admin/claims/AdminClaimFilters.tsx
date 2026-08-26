import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { VenueClaimRequestStatus } from "@/types/venueClaims";

export type AdminClaimStatusFilter = "all" | VenueClaimRequestStatus;

export function AdminClaimFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
}: {
  query: string;
  status: AdminClaimStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: AdminClaimStatusFilter) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search by venue, claimant name, email or role"
        aria-label="Search claim requests"
      />
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as AdminClaimStatusFilter)}
        aria-label="Filter claims by status"
        options={[
          { label: "All statuses", value: "all" },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
          { label: "Cancelled", value: "cancelled" },
        ]}
      />
    </div>
  );
}
