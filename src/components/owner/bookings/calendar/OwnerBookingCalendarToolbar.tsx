import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCalendarHeading } from "@/lib/bookingCalendarDates";
import type { BookingCalendarView } from "@/types/bookingCalendar";
import type { BookingRequestStatus } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";
import { OwnerBookingCalendarViewSwitcher } from "./OwnerBookingCalendarViewSwitcher";

export type BookingCalendarStatusPreset = "action_needed" | "upcoming_accepted" | "all_active" | "all";

export function OwnerBookingCalendarToolbar({
  view,
  anchorDate,
  venues,
  venueId,
  statusPreset,
  onViewChange,
  onVenueChange,
  onStatusPresetChange,
  onPrevious,
  onNext,
  onToday,
}: {
  view: BookingCalendarView;
  anchorDate: Date;
  venues: Venue[];
  venueId: string;
  statusPreset: BookingCalendarStatusPreset;
  onViewChange: (view: BookingCalendarView) => void;
  onVenueChange: (venueId: string) => void;
  onStatusPresetChange: (preset: BookingCalendarStatusPreset) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <OwnerBookingCalendarViewSwitcher value={view} onChange={onViewChange} />
          <h2 className="mt-3 font-brand text-2xl font-bold tracking-[-0.5px]">{formatCalendarHeading({ view, anchorDate })}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={venueId} onValueChange={onVenueChange} options={[{ label: "All venues", value: "all" }, ...venues.map((venue) => ({ label: venue.name, value: venue.id }))]} />
          <Select value={statusPreset} onValueChange={(value) => onStatusPresetChange(value as BookingCalendarStatusPreset)} options={[{ label: "Action needed", value: "action_needed" }, { label: "Upcoming accepted", value: "upcoming_accepted" }, { label: "All active", value: "all_active" }, { label: "All statuses", value: "all" }]} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Previous period" onClick={onPrevious}><ChevronLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" onClick={onToday}>Today</Button>
            <Button type="button" variant="outline" size="icon" aria-label="Next period" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function getStatusesForPreset(preset: BookingCalendarStatusPreset): BookingRequestStatus[] {
  if (preset === "action_needed") return ["pending", "customer_accepted_alternative"];
  if (preset === "upcoming_accepted") return ["accepted", "customer_accepted_alternative"];
  if (preset === "all") return [];
  return ["pending", "accepted", "alternative_proposed", "customer_accepted_alternative"];
}
