import { Link } from "react-router-dom";
import { formatBookingWindowLabel, formatDayOfWeek, formatNoticePeriod } from "@/lib/bookingAvailabilityLabels";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { OpeningHours } from "@/types/venue";

export function VenueBookingSideRail({
  venueSlug,
  openingHours,
  availability,
}: {
  venueSlug: string;
  openingHours: OpeningHours[];
  availability: VenueBookingAvailability;
}) {
  const { settings, windows, blackoutDates } = availability;

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border bg-card px-[14px] py-[13px]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-nokta-ink">Booking rules</h2>
          <Link to={`/owner/venues/${venueSlug}/bookings/rules`} className="text-[12.5px] font-medium text-clay-accent hover:underline">Edit</Link>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <OpeningRow label="Requests" value={settings.bookingRequestsEnabled ? "On" : "Off"} isPositive={settings.bookingRequestsEnabled} />
          <OpeningRow label="Parties per time" value={settings.slotCapacity === 1 ? "1" : `Up to ${settings.slotCapacity}`} />
          <OpeningRow label="Party size" value={`${settings.minPartySize}–${settings.maxPartySize}`} />
          <OpeningRow label="Notice" value={formatNoticePeriod(settings.minNoticeMinutes)} />
          <OpeningRow label="Booked ahead" value={`${settings.maxAdvanceDays} days`} />
          <OpeningRow label="Closures" value={String(blackoutDates.length)} />
          <OpeningRow label="Request windows" value={windows.filter((entry) => entry.isEnabled).length ? summariseWindows(windows) : "None set"} />
        </div>
      </section>

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

      <section className="rounded-xl border bg-[oklch(0.97_0.015_60)] px-[14px] py-[13px]">
        <h2 className="text-[13px] font-semibold text-nokta-ink">How bookings work</h2>
        <p className="mt-1 text-[11.5px] leading-[1.5] text-muted-foreground">
          Customers request a time; you confirm it. Each slot — 6pm, say — holds {settings.slotCapacity === 1 ? "one party" : `up to ${settings.slotCapacity} parties`}: once
          {settings.slotCapacity === 1 ? " it is confirmed, the time" : " that many are confirmed, the time"} leaves your public page and further confirms are blocked.
          Requests still waiting on you don’t hold a slot, so two customers can ask for 6pm and you choose.
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
