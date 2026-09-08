import { AlertCircle, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { useVenueBookingGate } from "@/hooks/useVenueBookingGate";
import { getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getVenueBookingAvailability } from "@/services/bookingAvailabilityService";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVenueAnalyticsProperties } from "./venueDetailAnalytics";

const FALLBACK_TIME_OPTIONS = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];

export function BookingSidebarCard({ venue, className, compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(getTodayDateValue());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const { gate, isLoading: isLoadingGate, error: gateError } = useVenueBookingGate(venue);
  const availableTimeOptions = availability && date ? getBookingTimeOptions({ availability, selectedDate: date }) : [];
  const timeOptions = availableTimeOptions.length ? availableTimeOptions : FALLBACK_TIME_OPTIONS;

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
    if (!time) return;
    trackBookingCta(venue);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (partySize) params.set("partySize", String(partySize));
    const query = params.toString();
    navigate(`/venues/${venue.slug}/request-booking${query ? `?${query}` : ""}`);
  }

  if (isLoadingGate) return <div className={cn("rounded-2xl border border-nokta-border bg-white p-5 text-sm text-nokta-ink-muted", className)}>Checking booking availability…</div>;
  if (gateError) return <BookingGateErrorCard venue={venue} className={className} compact={compact} />;
  if (gate && gate.state !== "live") return <BookingUnavailableCard venue={venue} state={gate.state} className={className} compact={compact} />;

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
            placeholder="Time"
            options={timeOptions.map((option) => ({ label: option, value: option }))}
            disabled={!date}
            onValueChange={setTime}
          />
        </div>
        <Input type="number" min={1} max={100} value={partySize} aria-label="Party size" placeholder="Party size" className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm" onChange={(event) => setPartySize(event.target.value ? Number(event.target.value) : 0)} />
      </div>
      <div className="mt-4 grid gap-2">
        <Button type="submit" className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark" disabled={!date || !time}>Request booking</Button>
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
  const { gate, isLoading, error } = useVenueBookingGate(venue);
  const takesBookings = gate?.state === "live";
  const directHref = venue.website ?? (venue.phone ? `tel:${venue.phone}` : `/venues/${venue.slug}/enquire`);
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-nokta-border bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(28,25,23,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-nokta-ink">{takesBookings ? (venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC") : "Books directly"}</p>
          <p className="truncate text-xs text-nokta-ink-muted">{takesBookings ? "Request a booking" : venue.phone ?? "Contact the venue"}</p>
        </div>
        {isLoading ? <Button type="button" disabled className="h-11 shrink-0 rounded-lg px-5">Checking…</Button> : takesBookings ? <Button type="button" className="h-11 shrink-0 rounded-lg bg-nokta-accent px-5 text-white hover:bg-nokta-accent-dark" onClick={() => setOpen(true)}>Request booking</Button> : <Button asChild className="h-11 shrink-0 rounded-lg bg-nokta-accent px-5 text-white hover:bg-nokta-accent-dark"><a href={directHref}>{error ? "Contact venue" : venue.website ? "Website" : venue.phone ? "Call venue" : "Send enquiry"}</a></Button>}
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

function BookingGateErrorCard({ venue, className, compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  return (
    <aside className={cn("rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5", compact && "border-0 p-0 shadow-none", className)}>
      <h2 className="text-[15px] font-semibold text-nokta-ink">Booking requests are unavailable right now</h2>
      <p className="mt-2 text-sm leading-6 text-nokta-ink-muted">Contact {venue.name} directly while we check their booking setup.</p>
      <div className="mt-4 grid gap-2">
        {venue.website ? <Button asChild className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark"><a href={venue.website} target="_blank" rel="noreferrer">Visit their website <ExternalLink className="ml-2 h-4 w-4" /></a></Button> : null}
        {venue.phone ? <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink"><a href={`tel:${venue.phone}`}><Phone className="mr-2 h-4 w-4" />{venue.phone}</a></Button> : null}
      </div>
    </aside>
  );
}

export function BookingUnavailableCard({ venue, state, className, compact = false }: { venue: Venue; state: "unclaimed" | "disabled" | "dormant"; className?: string; compact?: boolean }) {
  const content = state === "unclaimed"
    ? { title: "Books directly, not through Nokta", body: `${venue.name} hasn't joined Nokta yet, so we can't take a booking for them. Contact them and they'll answer straight away.` }
    : state === "disabled"
      ? { title: "Takes enquiries, not booking requests", body: `${venue.name} hasn't switched on date-and-time booking. Send an enquiry or contact them directly.` }
      : { title: "Calling is faster right now", body: `${venue.name} has been slow to reply on Nokta lately. Contact them directly for the quickest answer.` };
  return (
    <aside className={cn("rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5", compact && "border-0 p-0 shadow-none", className)}>
      <div className="flex items-start gap-3"><span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-nokta-page-bg"><AlertCircle className="h-4 w-4 text-nokta-accent" /></span><div><h2 className="text-[15px] font-semibold text-nokta-ink">{content.title}</h2><p className="mt-2 text-sm leading-6 text-nokta-ink-muted">{content.body}</p></div></div>
      <div className="mt-4 grid gap-2">
        {venue.website ? <Button asChild className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark"><a href={venue.website} target="_blank" rel="noreferrer">Book on their website <ExternalLink className="ml-2 h-4 w-4" /></a></Button> : null}
        {venue.phone ? <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink"><a href={`tel:${venue.phone}`}><Phone className="mr-2 h-4 w-4" />{venue.phone}</a></Button> : null}
        {state === "disabled" ? <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink" onClick={() => trackEnquiryCta(venue)}><Link to={`/venues/${venue.slug}/enquire`}>Send enquiry</Link></Button> : null}
      </div>
      {state === "unclaimed" ? <div className="mt-4 flex items-center justify-between gap-3 border-t border-nokta-border pt-4"><p className="text-[13px] text-nokta-ink-muted">Work here? Take bookings through Nokta.</p><Button asChild size="sm" className="shrink-0 bg-nokta-ink text-white hover:bg-nokta-ink/90"><Link to={`/venues/${venue.slug}/claim`}>Claim venue</Link></Button></div> : null}
    </aside>
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
