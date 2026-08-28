import { Select } from "@/components/ui/select";
import { formatAdminVenueEnquiryStatus, formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import type { VenueEnquiryStatus, VenueEnquiryType } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export type OwnerEnquiryDateFilter = "7d" | "30d" | "month" | "all";

export interface OwnerEnquiryFilterState {
  venueId: string;
  status: VenueEnquiryStatus | "all";
  type: VenueEnquiryType | "all";
  date: OwnerEnquiryDateFilter;
}

const STATUSES: (VenueEnquiryStatus | "all")[] = ["all", "new", "contacted", "responded", "converted", "closed", "spam"];
const TYPES: (VenueEnquiryType | "all")[] = ["all", "general", "birthday", "group", "football", "late-night", "private-hire"];

export function OwnerEnquiryFilters({ venues, value, onChange, lockVenue = false }: { venues: Venue[]; value: OwnerEnquiryFilterState; onChange: (value: OwnerEnquiryFilterState) => void; lockVenue?: boolean }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <Select disabled={lockVenue} value={value.venueId} onValueChange={(venueId) => onChange({ ...value, venueId })} options={[{ label: "All venues", value: "all" }, ...venues.map((venue) => ({ label: venue.name, value: venue.id }))]} />
        <Select value={value.status} onValueChange={(status) => onChange({ ...value, status: status as OwnerEnquiryFilterState["status"] })} options={STATUSES.map((status) => ({ label: status === "all" ? "All statuses" : formatAdminVenueEnquiryStatus(status), value: status }))} />
        <Select value={value.type} onValueChange={(type) => onChange({ ...value, type: type as OwnerEnquiryFilterState["type"] })} options={TYPES.map((type) => ({ label: type === "all" ? "All types" : formatVenueEnquiryType(type), value: type }))} />
        <Select value={value.date} onValueChange={(date) => onChange({ ...value, date: date as OwnerEnquiryDateFilter })} options={[{ label: "Last 30 days", value: "30d" }, { label: "Last 7 days", value: "7d" }, { label: "This month", value: "month" }, { label: "All time", value: "all" }]} />
      </div>
    </section>
  );
}
