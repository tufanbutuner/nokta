import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingCalendarView } from "@/types/bookingCalendar";

const VIEWS: { value: BookingCalendarView; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "list", label: "List" },
];

export function VenueBookingToolbar({
  view,
  heading,
  subheading,
  onChangeView,
  onStep,
}: {
  view: BookingCalendarView;
  heading: string;
  subheading?: string;
  onChangeView: (view: BookingCalendarView) => void;
  onStep: (amount: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label="Previous period"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border bg-card text-muted-foreground transition-colors hover:text-nokta-ink"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-nokta-ink">{heading}</span>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="Next period"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border bg-card text-muted-foreground transition-colors hover:text-nokta-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {subheading ? <span className="ml-1.5 text-xs text-muted-foreground">{subheading}</span> : null}
      </div>

      <div className="flex gap-1 rounded-[9px] bg-[oklch(0.93_0.02_55)] p-[3px]" role="tablist" aria-label="Calendar view">
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={view === option.value}
            onClick={() => onChangeView(option.value)}
            className={cn(
              "rounded-md px-[11px] py-[5px] text-[12.5px] text-muted-foreground transition-colors",
              view === option.value && "bg-card font-semibold text-nokta-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VenueBookingLegend({ showOpeningHours = true, note }: { showOpeningHours?: boolean; note: string }) {
  return (
    <div className="flex flex-wrap items-center gap-[14px] border-t bg-[oklch(0.975_0.012_60)] px-[14px] py-[11px] text-[11.5px] text-muted-foreground">
      <LegendSwatch className="border-[oklch(0.84_0.06_150)] bg-[oklch(0.96_0.02_150)]" label="Confirmed" />
      <LegendSwatch className="border-dashed border-[oklch(0.78_0.09_75)] bg-[oklch(0.97_0.04_75)]" label="Pending your reply" />
      {showOpeningHours ? <LegendSwatch className="border-transparent bg-[oklch(0.96_0.012_55)]" label="Outside opening hours" /> : null}
      <LegendSwatch className="border-transparent bg-[repeating-linear-gradient(45deg,oklch(0.94_0.012_55)_0_6px,oklch(0.965_0.008_55)_6px_12px)]" label="Closure" />
      <span className="ml-auto">{note}</span>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("h-[11px] w-[11px] rounded-[3px] border", className)} />
      {label}
    </span>
  );
}
