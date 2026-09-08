import { cn } from "@/lib/utils";
import {
  CALENDAR_BODY_HEIGHT_PX,
  CALENDAR_HOURS,
  getClosedBandGeometry,
  getClosureForDate,
  getEventGeometry,
  HOUR_HEIGHT_PX,
  isEventAwaitingReply,
} from "@/lib/bookingCalendarGeometry";
import { getDatesBetween } from "@/lib/bookingCalendarDates";
import { VenueBookingLegend } from "./VenueBookingToolbar";
import type { VenueBookingBlackoutDate } from "@/types/bookingAvailability";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";
import type { OpeningHours } from "@/types/venue";

export function VenueBookingWeekGrid({
  dateFrom,
  dateTo,
  events,
  openingHours,
  closures,
  onEventClick,
}: {
  dateFrom: string;
  dateTo: string;
  events: BookingCalendarEvent[];
  openingHours: OpeningHours[];
  closures: VenueBookingBlackoutDate[];
  onEventClick: (event: BookingCalendarEvent) => void;
}) {
  const dates = getDatesBetween(dateFrom, dateTo);
  const todayValue = new Date().toISOString().slice(0, 10);
  const columnTemplate = `52px repeat(${dates.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <div className={dates.length > 1 ? "min-w-[680px]" : ""}>
          <div className="grid border-b bg-[oklch(0.975_0.012_60)]" style={{ gridTemplateColumns: columnTemplate }}>
            <span />
            {dates.map((date) => {
              const day = new Date(`${date}T00:00:00`);
              return (
                <span key={date} className="py-[9px] text-center text-[11.5px] text-muted-foreground">
                  {day.toLocaleDateString("en-GB", { weekday: "short" })}{" "}
                  <span className={cn("font-bold text-nokta-ink", date === todayValue && "rounded-full bg-clay-accent px-1.5 text-white")}>
                    {day.getDate()}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="grid" style={{ gridTemplateColumns: columnTemplate }}>
            <div>
              {CALENDAR_HOURS.map((hour) => (
                <div key={hour} className="px-[7px] pt-1 text-right text-[10.5px] text-muted-foreground" style={{ height: HOUR_HEIGHT_PX }}>
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {dates.map((date) => (
              <DayColumn
                key={date}
                date={date}
                events={events.filter((event) => event.date === date)}
                openingHours={openingHours}
                closure={getClosureForDate({ closures, date })}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>
      </div>

      <VenueBookingLegend note="Blocks show a 2h default duration" />
    </div>
  );
}

function DayColumn({
  date,
  events,
  openingHours,
  closure,
  onEventClick,
}: {
  date: string;
  events: BookingCalendarEvent[];
  openingHours: OpeningHours[];
  closure: VenueBookingBlackoutDate | null;
  onEventClick: (event: BookingCalendarEvent) => void;
}) {
  const closedBand = getClosedBandGeometry({ openingHours, date });

  return (
    <div
      className="relative border-l"
      style={{
        height: CALENDAR_BODY_HEIGHT_PX,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_HEIGHT_PX - 1}px, oklch(0.95 0.012 55) ${HOUR_HEIGHT_PX - 1}px ${HOUR_HEIGHT_PX}px)`,
      }}
    >
      {closure ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,oklch(0.94_0.012_55)_0_6px,oklch(0.965_0.008_55)_6px_12px)] text-center text-[11px] font-semibold leading-tight text-muted-foreground">
          Closed
          <br />
          {closure.reason ?? "all day"}
        </div>
      ) : (
        <>
          {closedBand ? <div aria-hidden="true" className="absolute inset-x-0 bg-[oklch(0.96_0.012_55)]" style={{ top: closedBand.top, height: closedBand.height }} /> : null}
          {events.map((event) => {
            const geometry = getEventGeometry({ time: event.time });
            if (!geometry) return null;
            const pending = isEventAwaitingReply(event);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                style={{ top: geometry.top + 2, height: geometry.height - 4 }}
                className={cn(
                  "absolute left-[3px] right-[3px] overflow-hidden rounded-[7px] border border-l-[3px] px-[7px] py-[6px] text-left transition-shadow hover:shadow-sm",
                  pending
                    ? "border-dashed border-[oklch(0.78_0.09_75)] border-l-[oklch(0.68_0.12_75)] bg-[oklch(0.97_0.04_75)]"
                    : "border-[oklch(0.84_0.06_150)] border-l-[oklch(0.6_0.09_150)] bg-[oklch(0.96_0.02_150)]",
                )}
              >
                <span className="block text-[11px] font-semibold text-nokta-ink">{event.time.slice(0, 5)} · {event.partySize}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{event.customerName} · {pending ? "pending" : "confirmed"}</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
