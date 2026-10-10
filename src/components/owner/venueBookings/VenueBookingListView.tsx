import { cn } from "@/lib/utils";
import { formatDurationMinutes, getClosureForDate, getWaitingDays, isEventAwaitingReply } from "@/lib/bookingCalendarGeometry";
import type { VenueBookingBlackoutDate } from "@/types/bookingAvailability";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export type VenueBookingListFilter = "waiting" | "confirmed" | "all";

export function VenueBookingListView({
  events,
  closures,
  filter,
  counts,
  isPast,
  confirmingId,
  durationMinutes = 120,
  onChangeFilter,
  onTogglePast,
  onConfirm,
  onOpen,
}: {
  events: BookingCalendarEvent[];
  closures: VenueBookingBlackoutDate[];
  filter: VenueBookingListFilter;
  counts: Record<VenueBookingListFilter, number>;
  isPast: boolean;
  confirmingId: string | null;
  durationMinutes?: number;
  onChangeFilter: (filter: VenueBookingListFilter) => void;
  onTogglePast: () => void;
  onConfirm: (event: BookingCalendarEvent) => void;
  onOpen: (event: BookingCalendarEvent) => void;
}) {
  const grouped = groupByDate(events);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-[7px] p-[14px]">
        <FilterPill label="Waiting" count={counts.waiting} isActive={filter === "waiting"} onClick={() => onChangeFilter("waiting")} />
        <FilterPill label="Confirmed" count={counts.confirmed} isActive={filter === "confirmed"} onClick={() => onChangeFilter("confirmed")} />
        <FilterPill label="All" count={counts.all} isActive={filter === "all"} onClick={() => onChangeFilter("all")} />
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <FilterPill label="Past requests" isActive={isPast} onClick={onTogglePast} />
      </div>

      {grouped.length ? (
        grouped.map(([date, dayEvents]) => {
          const closure = getClosureForDate({ closures, date });
          const waiting = dayEvents.filter(isEventAwaitingReply).length;
          return (
            <div key={date}>
              <div className="flex items-center justify-between gap-3 border-y bg-[oklch(0.975_0.012_60)] px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-nokta-ink">{formatGroupHeading(date)}</span>
                <span className="text-[11px] text-muted-foreground">
                  {waiting ? `${waiting} waiting · ` : ""}{dayEvents.length - waiting} answered
                </span>
              </div>

              {closure ? (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[repeating-linear-gradient(45deg,oklch(0.94_0.012_55)_0_6px,oklch(0.965_0.008_55)_6px_12px)] px-4 py-[10px]">
                  <span className="text-[12.5px] font-semibold text-nokta-ink">Closed · {closure.reason ?? "all day"}</span>
                  <span className="text-[11.5px] text-muted-foreground">Requests off · no form on your page</span>
                </div>
              ) : null}

              {dayEvents.map((event) => {
                const pending = isEventAwaitingReply(event);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "grid grid-cols-[66px_1fr] items-center gap-[14px] border-b px-4 py-[13px] sm:grid-cols-[66px_1fr_auto]",
                      pending && "border-l-[3px] border-l-[oklch(0.68_0.12_75)] bg-[oklch(0.99_0.015_75)]",
                    )}
                  >
                    <div>
                      <div className="text-sm font-semibold text-nokta-ink">{event.time.slice(0, 5)}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDurationMinutes(durationMinutes)} slot</div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-nokta-ink">{event.customerName} · {event.partySize} people</span>
                        <StatusPill event={event} />
                      </div>
                      {event.occasion ? <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{event.occasion}</p> : null}
                    </div>

                    <div className="col-span-full flex gap-2 sm:col-span-1">
                      {pending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onConfirm(event)}
                            disabled={confirmingId === event.id}
                            className="h-[30px] rounded-lg bg-clay-accent px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-clay-accent/90 disabled:opacity-60"
                          >
                            {confirmingId === event.id ? "Confirming..." : "Confirm"}
                          </button>
                          <button type="button" onClick={() => onOpen(event)} className="flex h-[30px] items-center rounded-lg border bg-card px-3 text-[12.5px] font-medium text-nokta-ink transition-colors hover:bg-muted">
                            Reply
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => onOpen(event)} className="flex h-[30px] items-center rounded-lg border bg-card px-3 text-[12.5px] font-medium text-nokta-ink transition-colors hover:bg-muted">
                          Open
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      ) : (
        <div className="p-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            {filter === "waiting"
              ? isPast
                ? "No requests were waiting in those 30 days."
                : "Nothing waiting in the next 30 days."
              : filter === "confirmed"
                ? "No confirmed bookings in this range."
                : "No requests in this range."}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/80">
            {filter === "waiting" ? "New requests land here the moment a customer sends one." : "Try another filter or step to a different period."}
          </p>
          {filter === "waiting" ? (
            <button type="button" onClick={() => onChangeFilter("all")} className="mt-2 text-[12.5px] font-medium text-clay-accent hover:underline">See all requests</button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatusPill({ event }: { event: BookingCalendarEvent }) {
  const pending = isEventAwaitingReply(event);
  if (pending) {
    const days = getWaitingDays(event.createdAt);
    return (
      <span className="rounded-full bg-[oklch(0.96_0.045_75)] px-2 py-[2px] text-[11px] font-semibold text-[oklch(0.36_0.08_75)]">
        {days >= 1 ? `Waiting ${days}d` : "Waiting"}
      </span>
    );
  }
  if (event.status === "accepted") {
    return <span className="rounded-full bg-[oklch(0.94_0.02_150)] px-2 py-[2px] text-[11px] font-semibold text-[oklch(0.36_0.06_150)]">Confirmed</span>;
  }
  return <span className="rounded-full bg-muted px-2 py-[2px] text-[11px] font-semibold capitalize text-muted-foreground">{event.status.replace(/_/g, " ")}</span>;
}

function FilterPill({ label, count, isActive, onClick }: { label: string; count?: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[31px] items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors",
        isActive ? "bg-nokta-ink font-medium text-white" : "border bg-card text-muted-foreground hover:text-nokta-ink",
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span className={cn("rounded-full px-1.5 text-[11px]", isActive ? "bg-white/20" : "bg-muted")}>{count}</span>
      ) : null}
    </button>
  );
}

function groupByDate(events: BookingCalendarEvent[]): [string, BookingCalendarEvent[]][] {
  const groups = new Map<string, BookingCalendarEvent[]>();
  for (const event of [...events].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))) {
    groups.set(event.date, [...(groups.get(event.date) ?? []), event]);
  }
  return [...groups.entries()];
}

function formatGroupHeading(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  const today = new Date().toISOString().slice(0, 10);
  const label = value.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return date === today ? `Today · ${label}` : label;
}
