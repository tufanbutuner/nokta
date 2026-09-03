import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getVenueBookingAvailability } from "@/services/bookingAvailabilityService";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVenueAnalyticsProperties } from "./venueDetailAnalytics";

export function BookingSidebarCard({ venue, className, compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(getTodayDateValue());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const timeOptions = availability && date ? getBookingTimeOptions({ availability, selectedDate: date }) : [];
  const hasAvailabilityForDate = Boolean(availability && date && timeOptions.length);

  useEffect(() => {
    let cancelled = false;
    getVenueBookingAvailability(venue.id)
      .then((nextAvailability) => {
        if (!cancelled) setAvailability(nextAvailability);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });

    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availability && !time) return;
    trackBookingCta(venue);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (partySize) params.set("partySize", String(partySize));
    const query = params.toString();
    navigate(`/venues/${venue.slug}/request-booking${query ? `?${query}` : ""}`);
  }

  return (
    <form className={cn("rounded-2xl border border-nokta-border bg-white p-4 shadow-sm shadow-stone-950/5 sm:p-5", compact && "border-0 p-0 shadow-none sm:p-0", className)} onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        {!compact ? <h2 className="text-[15px] font-semibold text-nokta-ink">Request a booking</h2> : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="hidden h-10 w-10 shrink-0 border lg:inline-flex" />
      </div>
      <div className={cn("mt-4 grid gap-3", compact && "mt-0")}>
        <div className="grid gap-2 min-[380px]:grid-cols-2">
          <Input
            type="date"
            value={date}
            aria-label="Booking date"
            className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm"
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
          />
          <Select
            value={time}
            aria-label="Booking time"
            className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm"
            placeholder={availability && date ? timeOptions.length ? "Time" : "No times" : "Choose date"}
            options={timeOptions.map((option) => ({ label: option, value: option }))}
            disabled={!hasAvailabilityForDate}
            onValueChange={setTime}
          />
        </div>
        <Input type="number" min={1} max={100} value={partySize} aria-label="Party size" placeholder="Party size" className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm" onChange={(event) => setPartySize(event.target.value ? Number(event.target.value) : 0)} />
      </div>
      <div className="mt-4 grid gap-2">
        <Button type="submit" className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark" disabled={Boolean(availability && (!date || !time))}>Request booking</Button>
        <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink hover:bg-nokta-surface-hover" onClick={() => trackEnquiryCta(venue)}>
          <Link to={`/venues/${venue.slug}/enquire`}>Send enquiry</Link>
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-nokta-ink-muted">Requests are confirmed once the venue accepts.</p>
    </form>
  );
}

export function MobileBookingCta({ venue }: { venue: Venue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-nokta-border bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(28,25,23,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-nokta-ink">{venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC"}</p>
          <p className="truncate text-xs text-nokta-ink-muted">Request a booking</p>
        </div>
        <Button type="button" className="h-11 shrink-0 rounded-lg bg-nokta-accent px-5 text-white hover:bg-nokta-accent-dark" onClick={() => setOpen(true)}>
          Request booking
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} side="bottom">
        <SheetHeader>
          <div>
            <SheetTitle>Request a booking</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">{venue.name}</p>
          </div>
          <SheetClose onClick={() => setOpen(false)} />
        </SheetHeader>
        <BookingSidebarCard venue={venue} compact />
      </Sheet>
    </div>
  );
}

function trackEnquiryCta(venue: Venue) {
  trackEvent("enquiry_cta_clicked", getVenueAnalyticsProperties(venue));
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "venue_enquiry_cta_clicked",
    city: venue.city,
    area: venue.area,
    sourceSurface: "venue_page",
  });
}

function trackBookingCta(venue: Venue) {
  trackEvent("booking_request_started", { ...getVenueAnalyticsProperties(venue), city: venue.city, sourceSurface: "venue_page" });
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "venue_booking_cta_clicked",
    city: venue.city,
    area: venue.area,
    sourceSurface: "venue_page",
  });
}

function getTodayDateValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
