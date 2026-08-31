import { cn } from "@/lib/utils";
import type { BookingCalendarView } from "@/types/bookingCalendar";

const VIEWS: { label: string; value: BookingCalendarView }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "List", value: "list" },
];

export function OwnerBookingCalendarViewSwitcher({ value, onChange }: { value: BookingCalendarView; onChange: (view: BookingCalendarView) => void }) {
  return (
    <div className="inline-flex rounded-xl border bg-card p-1">
      {VIEWS.map((view) => (
        <button key={view.value} type="button" className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition", value === view.value && "bg-nokta-ink text-clay-50")} onClick={() => onChange(view.value)}>
          {view.label}
        </button>
      ))}
    </div>
  );
}
