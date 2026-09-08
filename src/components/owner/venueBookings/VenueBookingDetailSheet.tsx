import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingCalendarEvent } from "@/types/bookingCalendar";

export function VenueBookingDetailSheet({ event, request, isSaving, onClose, onConfirm, onDecline, onSuggestTime }: {
  event: BookingCalendarEvent | null;
  request: BookingRequest | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDecline: () => void;
  onSuggestTime: () => void;
}) {
  return <Sheet open={Boolean(event)} onOpenChange={(open) => { if (!open) onClose(); }}>
    {event ? <>
      <SheetHeader><SheetTitle>Booking request</SheetTitle><SheetClose onClick={onClose} /></SheetHeader>
      <div className="flex items-center gap-2"><Status status={event.status} /><span className="text-xs text-muted-foreground">{formatDate(event.date)}</span></div>
      <h3 className="mt-4 font-brand text-[22px] font-bold">{event.customerName} · {event.partySize} people</h3>
      <p className="mt-1 text-sm text-muted-foreground">{event.time.slice(0, 5)} at {event.venueName}</p>
      <dl className="mt-5 grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2">
        <Detail label="Occasion" value={request?.occasion ?? event.occasion ?? "Not specified"} />
        <Detail label="Phone" value={request?.customerPhone ?? "Not supplied"} />
        <Detail label="Email" value={request?.customerEmail ?? "Loading…"} />
        <Detail label="Source" value={request?.sourceSurface?.replace(/_/g, " ") ?? event.sourceSurface?.replace(/_/g, " ") ?? "Direct"} />
      </dl>
      <section className="mt-4 rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">Customer message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request?.message ?? (request ? "No message supplied." : "Loading…")}</p></section>
      {event.status === "pending" ? <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button disabled={isSaving} onClick={onConfirm}>Confirm</Button><Button variant="outline" disabled={isSaving} onClick={onSuggestTime}>Suggest another time</Button><Button variant="outline" disabled={isSaving} onClick={onDecline} className="sm:col-span-2">Decline</Button></div> : null}
    </> : null}
  </Sheet>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium capitalize">{value}</dd></div>; }
function Status({ status }: { status: BookingCalendarEvent["status"] }) { return <span className={cn("rounded-full px-2 py-1 text-xs font-semibold capitalize", status === "pending" ? "bg-amber-100 text-amber-800" : status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>{status.replace(/_/g, " ")}</span>; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); }
