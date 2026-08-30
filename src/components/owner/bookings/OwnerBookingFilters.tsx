import { Select } from "@/components/ui/select";
import { formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import type { BookingRequestStatus } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";

export type OwnerBookingDateFilter = "7d" | "30d" | "month" | "all";

export interface OwnerBookingFilterState {
  venueId: string;
  status: BookingRequestStatus | "all";
  date: OwnerBookingDateFilter;
}

const STATUSES: (BookingRequestStatus | "all")[] = ["all", "pending", "accepted", "alternative_proposed", "declined", "cancelled", "completed", "no_show", "spam"];

export function OwnerBookingFilters({ venues, value, onChange, lockVenue = false }: { venues: Venue[]; value: OwnerBookingFilterState; onChange: (value: OwnerBookingFilterState) => void; lockVenue?: boolean }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <Select disabled={lockVenue} value={value.venueId} onValueChange={(venueId) => onChange({ ...value, venueId })} options={[{ label: "All venues", value: "all" }, ...venues.map((venue) => ({ label: venue.name, value: venue.id }))]} />
        <Select value={value.status} onValueChange={(status) => onChange({ ...value, status: status as OwnerBookingFilterState["status"] })} options={STATUSES.map((status) => ({ label: status === "all" ? "All statuses" : formatBookingRequestStatus(status), value: status }))} />
        <Select value={value.date} onValueChange={(date) => onChange({ ...value, date: date as OwnerBookingDateFilter })} options={[{ label: "Last 30 days", value: "30d" }, { label: "Last 7 days", value: "7d" }, { label: "This month", value: "month" }, { label: "All time", value: "all" }]} />
      </div>
    </section>
  );
}
