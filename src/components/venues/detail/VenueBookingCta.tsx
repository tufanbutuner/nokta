import { AlertCircle, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useVenueBookingGate } from "@/hooks/useVenueBookingGate";
import { FALLBACK_TIME_OPTIONS, getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getVenueBookingAvailability } from "@/services/bookingAvailabilityService";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVenueAnalyticsProperties } from "./venueDetailAnalytics";

const PARTY_SIZE_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1);

/**
 * Every venue takes booking requests, claimed or not. `isClaimed` changes only the
 * explanatory line and the claim nudge — never the presence of the form. A venue that has
 * explicitly turned requests off still gets the enquiry route without date/time/party.
 */
export function BookingSidebarCard({ venue, className, compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(getTodayDateValue());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const { gate } = useVenueBookingGate(venue);
  const availableTimeOptions = availability && date ? getBookingTimeOptions({ availability, selectedDate: date }) : [];
  const timeOptions = availableTimeOptions.length ? availableTimeOptions : FALLBACK_TIME_OPTIONS;
  // Only an explicit opt-out removes the date/time/party fields; unclaimed venues keep them.
  const requestsDisabled = gate?.isClaimed === true && gate.bookingRequestsEnabled === false;
  const hasDirectContact = Boolean(venue.phone || venue.website);

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

  return (
    <form className={cn("rounded-2xl border border-nokta-border bg-white p-[17px] shadow-[0_1px_3px_rgba(28,25,23,0.05)]", compact && "border-0 p-0 shadow-none", className)} onSubmit={handleSubmit}>
      {!compact ? <h2 className="text-[15px] font-semibold text-nokta-ink">Request a booking</h2> : null}
      <p className={cn("text-[13px] leading-[1.55] text-nokta-ink-muted", compact ? "mt-0" : "mt-2")}>{getBookingNote(venue, requestsDisabled)}</p>

      <div className="mt-3.5 grid gap-2.5">
        {requestsDisabled ? null : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={date}
                aria-label="Booking date"
                className="h-11 rounded-lg border-nokta-border-input bg-white px-[11px] text-base text-nokta-ink sm:text-sm"
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                }}
              />
              <Select value={time} aria-label="Booking time" className="h-11 rounded-lg border-nokta-border-input bg-white px-[11px] text-base text-nokta-ink sm:text-sm" placeholder="Time" options={timeOptions.map((option) => ({ label: option, value: option }))} disabled={!date} onValueChange={setTime} />
            </div>
            <Select value={String(partySize)} aria-label="Party size" className="h-11 rounded-lg border-nokta-border-input bg-white px-[11px] text-base text-nokta-ink sm:text-sm" options={PARTY_SIZE_OPTIONS.map((size) => ({ label: `${size} ${size === 1 ? "person" : "people"}`, value: String(size) }))} onValueChange={(value) => setPartySize(Number(value))} />
            <Button type="submit" className="h-[46px] rounded-lg bg-clay-accent text-[14.5px] font-semibold text-white hover:bg-clay-accent-hover" disabled={!date || !time}>
              Request booking
            </Button>
          </>
        )}
        <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-sm font-medium text-nokta-ink hover:bg-nokta-hover" onClick={() => trackEnquiryCta(venue)}>
          <Link to={`/venues/${venue.slug}/enquire`}>Send enquiry</Link>
        </Button>
      </div>

      {hasDirectContact ? (
        <div className="mt-3.5 flex flex-wrap gap-2 border-t border-nokta-row-border pt-[13px]">
          {venue.phone ? (
            <a href={`tel:${venue.phone}`} className="inline-flex min-h-9 items-center gap-[7px] rounded-lg border border-nokta-border px-3 py-1.5 text-[13px] font-medium text-nokta-ink transition-colors hover:bg-nokta-hover">
              <Phone className="h-3.5 w-3.5" />
              {venue.phone}
            </a>
          ) : null}
          {venue.website ? (
            <a href={venue.website} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-9 items-center gap-[7px] rounded-lg border border-nokta-border px-3 py-1.5 text-[13px] font-medium text-nokta-ink transition-colors hover:bg-nokta-hover">
              <ExternalLink className="h-3.5 w-3.5" />
              Book on their site
            </a>
          ) : null}
        </div>
      ) : null}

      {!venue.isClaimed ? (
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-nokta-row-border pt-[13px]">
          <p className="max-w-[172px] text-[12.5px] leading-[1.45] text-nokta-ink-subtle">Work here? Take bookings through nokta.</p>
          <Button asChild className="h-9 shrink-0 rounded-lg bg-nokta-ink px-[13px] text-[12.5px] font-medium text-white hover:bg-nokta-ink/90">
            <Link to={`/venues/${venue.slug}/claim`}>Claim venue</Link>
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function MobileBookingCta({ venue }: { venue: Venue }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-nokta-border bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(28,25,23,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-nokta-ink">{venue.name}</p>
          <p className="truncate text-xs text-nokta-ink-muted">Request a booking</p>
        </div>
        <Button type="button" className="h-11 shrink-0 rounded-lg bg-clay-accent px-5 text-white hover:bg-clay-accent-hover" onClick={() => setOpen(true)}>
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

/**
 * Still used by RequestBookingPage, which keeps its own gate for venues that turned
 * requests off after the customer landed on the form.
 */
export function BookingUnavailableCard({ venue, state, className, compact = false }: { venue: Venue; state: "unclaimed" | "disabled"; className?: string; compact?: boolean }) {
  const content = state === "unclaimed"
    ? { title: "Books directly, not through nokta", body: `${venue.name} hasn't joined nokta yet, so we can't take a booking for them. Contact them and they'll answer straight away.` }
    : { title: "Takes enquiries, not booking requests", body: `${venue.name} hasn't switched on date-and-time booking. Send an enquiry or contact them directly.` };
  return (
    <aside className={cn("rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5", compact && "border-0 p-0 shadow-none", className)}>
      <div className="flex items-start gap-3"><span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-nokta-page-bg"><AlertCircle className="h-4 w-4 text-nokta-accent" /></span><div><h2 className="text-[15px] font-semibold text-nokta-ink">{content.title}</h2><p className="mt-2 text-sm leading-6 text-nokta-ink-muted">{content.body}</p></div></div>
      <div className="mt-4 grid gap-2">
        {venue.website ? <Button asChild className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark"><a href={venue.website} target="_blank" rel="noreferrer">Book on their website <ExternalLink className="ml-2 h-4 w-4" /></a></Button> : null}
        {venue.phone ? <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink"><a href={`tel:${venue.phone}`}><Phone className="mr-2 h-4 w-4" />{venue.phone}</a></Button> : null}
        {state === "disabled" ? <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink" onClick={() => trackEnquiryCta(venue)}><Link to={`/venues/${venue.slug}/enquire`}>Send enquiry</Link></Button> : null}
      </div>
      {state === "unclaimed" ? <div className="mt-4 flex items-center justify-between gap-3 border-t border-nokta-border pt-4"><p className="text-[13px] text-nokta-ink-muted">Work here? Take bookings through nokta.</p><Button asChild size="sm" className="shrink-0 bg-nokta-ink text-white hover:bg-nokta-ink/90"><Link to={`/venues/${venue.slug}/claim`}>Claim venue</Link></Button></div> : null}
    </aside>
  );
}

function getBookingNote(venue: Venue, requestsDisabled: boolean): string {
  if (requestsDisabled) return `${venue.name} isn't taking date-and-time requests. Send an enquiry and they'll reply directly.`;
  if (!venue.isClaimed) return `${venue.name} isn't managing bookings on nokta yet. Send a request and we'll pass it to them, or contact them directly below.`;
  return "Requests are confirmed once the venue accepts. Usually within an hour during opening times.";
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
