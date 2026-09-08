import { Link } from "react-router-dom";
import { formatBookingWindowLabel, formatDayOfWeek, formatNoticePeriod } from "@/lib/bookingAvailabilityLabels";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { OpeningHours } from "@/types/venue";

export function VenueBookingSideRail({
  venueSlug,
  waitingCount,
  oldestWaitingDays,
  openingHours,
  availability,
}: {
  venueSlug: string;
  waitingCount: number;
  oldestWaitingDays: number | null;
  openingHours: OpeningHours[];
  availability: VenueBookingAvailability;
}) {
  const { settings, windows, blackoutDates } = availability;

  return (
    <div className="flex flex-col gap-3">
      {waitingCount > 0 ? (
        <section className="rounded-xl border border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)] px-[14px] py-[13px]">
          <h2 className="text-[13px] font-semibold text-nokta-ink">{waitingCount} request{waitingCount === 1 ? "" : "s"} waiting</h2>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-muted-foreground">
            {oldestWaitingDays && oldestWaitingDays >= 1 ? `Oldest sent ${oldestWaitingDays} day${oldestWaitingDays === 1 ? "" : "s"} ago. ` : ""}
            Customers see “awaiting the venue” until you reply.
          </p>
          <Link to="/owner/inbox?status=needs-reply&type=booking" className="mt-2.5 flex h-8 items-center justify-center rounded-lg bg-clay-accent px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-clay-accent/90">
            Reply in Inbox
          </Link>
        </section>
      ) : null}

      <section className="rounded-xl border bg-card px-[14px] py-[13px]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-nokta-ink">Opening hours</h2>
          <Link to={`/owner/venues/${venueSlug}/profile`} className="text-[12.5px] font-medium text-clay-accent hover:underline">Edit</Link>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {openingHours.length ? (
            openingHours.slice(0, 7).map((entry) => <OpeningRow key={entry.day} label={entry.day} value={`${entry.open}–${entry.close}`} />)
          ) : (
            <p className="text-[11.5px] text-muted-foreground">No opening hours set.</p>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-[1.5] text-muted-foreground">Changes here go to nokta for approval — hours show on your public page.</p>
      </section>

      <section className="rounded-xl border bg-card px-[14px] py-[13px]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-nokta-ink">Booking rules</h2>
          <Link to={`/owner/venues/${venueSlug}/bookings/rules`} className="text-[12.5px] font-medium text-clay-accent hover:underline">Edit</Link>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <OpeningRow label="Requests" value={settings.bookingRequestsEnabled ? "On" : "Off"} isPositive={settings.bookingRequestsEnabled} />
          <OpeningRow label="Party size" value={`${settings.minPartySize}–${settings.maxPartySize}`} />
          <OpeningRow label="Notice" value={formatNoticePeriod(settings.minNoticeMinutes)} />
          <OpeningRow label="Booked ahead" value={`${settings.maxAdvanceDays} days`} />
          <OpeningRow label="Closures" value={String(blackoutDates.length)} />
          <OpeningRow label="Request windows" value={windows.filter((entry) => entry.isEnabled).length ? summariseWindows(windows) : "None set"} />
        </div>
      </section>

      <section className="rounded-xl border bg-[oklch(0.97_0.015_60)] px-[14px] py-[13px]">
        <h2 className="text-[13px] font-semibold text-nokta-ink">This is a request log</h2>
        <p className="mt-1 text-[11.5px] leading-[1.5] text-muted-foreground">
          nokta does not hold tables, check capacity or stop double-bookings. Every block here is a request you either confirmed or still owe a reply.
        </p>
      </section>
    </div>
  );
}

function OpeningRow({ label, value, isPositive }: { label: string; value: string; isPositive?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-[11.5px]">
      <span className="capitalize text-muted-foreground">{label}</span>
      <span className={isPositive ? "font-semibold text-[oklch(0.36_0.06_150)]" : "font-medium text-nokta-ink"}>{value}</span>
    </div>
  );
}

function summariseWindows(windows: VenueBookingAvailability["windows"]): string {
  const enabled = windows.filter((entry) => entry.isEnabled);
  if (!enabled.length) return "None set";
  const first = enabled[0];
  const sameEverywhere = enabled.every((entry) => entry.startTime === first.startTime && entry.endTime === first.endTime);
  if (sameEverywhere) return `${enabled.length === 7 ? "Every day" : `${enabled.length} days`} · ${formatBookingWindowLabel({ startTime: first.startTime, endTime: first.endTime })}`;
  // Mixed windows: name the days rather than implying one continuous run.
  const dayNames = [...enabled].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((entry) => formatDayOfWeek(entry.dayOfWeek).slice(0, 3));
  return `${enabled.length} days · ${dayNames[0]}–${dayNames[dayNames.length - 1]}`;
}
