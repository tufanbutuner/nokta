import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDurationMinutes, getWaitingDays } from "@/lib/bookingCalendarGeometry";
import { cn } from "@/lib/utils";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export interface SuggestedAlternative {
  proposedDate: string;
  proposedTime: string;
  proposedMessage?: string;
}

export function VenueBookingDetailSheet({ event, request, isSaving, durationMinutes = 120, onClose, onConfirm, onDecline, onSuggestTime }: {
  event: BookingCalendarEvent | null;
  request: BookingRequest | null;
  isSaving: boolean;
  durationMinutes?: number;
  onClose: () => void;
  onConfirm: () => void;
  onDecline: () => void;
  onSuggestTime: (alternative: SuggestedAlternative) => void;
}) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [proposedMessage, setProposedMessage] = useState("");

  // Reset the composer whenever a different request is opened.
  useEffect(() => {
    setShowSuggest(false);
    setProposedDate(event?.date ?? "");
    setProposedTime(event?.time.slice(0, 5) ?? "");
    setProposedMessage("");
  }, [event?.id, event?.date, event?.time]);

  const waitingDays = event && event.status === "pending" ? getWaitingDays(event.createdAt) : 0;
  const hasProposed = Boolean(event && (event.status === "alternative_proposed" || event.status === "customer_accepted_alternative") && request?.proposedDate);

  return (
    <Sheet open={Boolean(event)} onOpenChange={(open) => { if (!open) onClose(); }}>
      {event ? <>
        <SheetHeader><SheetTitle>Booking request</SheetTitle><SheetClose onClick={onClose} /></SheetHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Status status={event.status} />
          <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
          {event.status === "pending" && waitingDays >= 1 ? <span className="text-xs font-medium text-[oklch(0.42_0.09_75)]">Waiting {waitingDays}d</span> : null}
        </div>
        <h3 className="mt-4 font-brand text-[22px] font-bold">{event.customerName} · {event.partySize} people</h3>
        <p className="mt-1 text-sm text-muted-foreground">{event.time.slice(0, 5)} · {formatDurationMinutes(durationMinutes)} at {event.venueName}</p>

        {hasProposed ? (
          <p className="mt-3 rounded-xl border border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)] px-3 py-2 text-[12.5px] text-nokta-ink">
            {event.status === "alternative_proposed"
              ? `You offered ${formatDate(request!.proposedDate!)} at ${request!.proposedTime!.slice(0, 5)} — waiting on the customer.`
              : `Customer accepted ${formatDate(request!.proposedDate!)} at ${request!.proposedTime!.slice(0, 5)} — confirm to lock it in.`}
          </p>
        ) : null}

        <dl className="mt-5 grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2">
          <Detail label="Occasion" value={request?.occasion ?? event.occasion ?? "Not specified"} />
          <Detail label="Phone" value={request?.customerPhone ?? "Not supplied"} href={request?.customerPhone ? `tel:${request.customerPhone}` : undefined} />
          <Detail label="Email" value={request?.customerEmail ?? "Loading…"} href={request?.customerEmail ? `mailto:${request.customerEmail}` : undefined} />
          <Detail label="Source" value={request?.sourceSurface?.replace(/_/g, " ") ?? event.sourceSurface?.replace(/_/g, " ") ?? "Direct"} />
        </dl>

        <section className="mt-4 rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Customer message</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request?.message ?? (request ? "No message supplied." : "Loading…")}</p>
        </section>

        {event.status === "pending" ? (
          showSuggest ? (
            <section className="mt-4 rounded-xl border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Suggest another time</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input type="date" value={proposedDate} aria-label="Alternative date" onChange={(setEvent) => setProposedDate(setEvent.target.value)} />
                <Input type="time" value={proposedTime} aria-label="Alternative time" onChange={(setEvent) => setProposedTime(setEvent.target.value)} />
              </div>
              <Textarea
                className="mt-2 text-[13px]"
                value={proposedMessage}
                placeholder="Message to the customer (optional)"
                onChange={(setEvent) => setProposedMessage(setEvent.target.value)}
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={isSaving || !proposedDate || !proposedTime}
                  onClick={() => onSuggestTime({ proposedDate, proposedTime, proposedMessage: proposedMessage.trim() || undefined })}
                >
                  {isSaving ? "Sending..." : "Send suggestion"}
                </Button>
                <Button variant="outline" disabled={isSaving} onClick={() => setShowSuggest(false)}>Cancel</Button>
              </div>
            </section>
          ) : (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button disabled={isSaving} onClick={onConfirm}>{isSaving ? "Confirming..." : "Confirm"}</Button>
              <Button variant="outline" disabled={isSaving} onClick={() => setShowSuggest(true)}>Suggest another time</Button>
              <Button variant="outline" disabled={isSaving} onClick={onDecline} className="sm:col-span-2">Decline</Button>
            </div>
          )
        ) : null}
      </> : null}
    </Sheet>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium capitalize">
        {href ? <a href={href} className="hover:text-clay-accent hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function Status({ status }: { status: BookingCalendarEvent["status"] }) {
  return <span className={cn("rounded-full px-2 py-1 text-xs font-semibold capitalize", status === "pending" ? "bg-amber-100 text-amber-800" : status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>{status.replace(/_/g, " ")}</span>;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
