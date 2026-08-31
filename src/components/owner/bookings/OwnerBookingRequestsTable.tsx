import { MoreHorizontal } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatBookingRequestDateTime } from "@/lib/bookingRequestLabels";
import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";
import { OwnerBookingStatusBadge } from "./OwnerBookingStatusBadge";

export function OwnerBookingRequestsTable({
  bookings,
  venuesById,
  onView,
  onStatus,
  onDecline,
  onPropose,
}: {
  bookings: BookingRequest[];
  venuesById: Record<string, Venue | undefined>;
  onView: (booking: BookingRequest) => void;
  onStatus: (booking: BookingRequest, status: BookingRequestStatus) => void;
  onDecline: (booking: BookingRequest) => void;
  onPropose: (booking: BookingRequest) => void;
}) {
  if (!bookings.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No booking requests match these filters.</div>;

  return (
    <>
      <div className="grid gap-3 lg:hidden">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} venue={venuesById[booking.venueId]} onView={() => onView(booking)} onStatus={(status) => onStatus(booking, status)} onDecline={() => onDecline(booking)} onPropose={() => onPropose(booking)} />)}</div>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Party</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">Occasion</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="w-16 px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => {
                const venue = venuesById[booking.venueId];
                return (
                  <tr key={booking.id}>
                    <td className="px-4 py-4"><button className="font-medium hover:text-clay-accent" onClick={() => onView(booking)}>{booking.customerName}</button><div className="mt-1 text-xs text-muted-foreground">{booking.customerEmail}</div>{booking.customerPhone ? <div className="mt-1 text-xs text-muted-foreground">{booking.customerPhone}</div> : null}</td>
                    <td className="px-4 py-4 text-muted-foreground">{venue?.name ?? booking.venueId}</td>
                    <td className="px-4 py-4">{booking.partySize}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{booking.occasion ?? "General"}</td>
                    <td className="px-4 py-4"><OwnerBookingStatusBadge status={booking.status} /></td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-4 text-right"><BookingActions booking={booking} onStatus={(status) => onStatus(booking, status)} onDecline={() => onDecline(booking)} onPropose={() => onPropose(booking)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function BookingCard({ booking, venue, onView, onStatus, onDecline, onPropose }: { booking: BookingRequest; venue?: Venue; onView: () => void; onStatus: (status: BookingRequestStatus) => void; onDecline: () => void; onPropose: () => void }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><div><button className="font-semibold hover:text-clay-accent" onClick={onView}>{booking.customerName}</button><p className="mt-1 text-sm text-muted-foreground">{venue?.name ?? booking.venueId}</p></div><OwnerBookingStatusBadge status={booking.status} /></div>
      <p className="mt-3 text-sm text-muted-foreground">{booking.partySize} people • {formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)}</p>
      <div className="mt-4"><BookingActions booking={booking} onStatus={onStatus} onDecline={onDecline} onPropose={onPropose} /></div>
    </article>
  );
}

function BookingActions({ booking, onStatus, onDecline, onPropose }: { booking: BookingRequest; onStatus: (status: BookingRequestStatus) => void; onDecline: () => void; onPropose: () => void }) {
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  function toggleMenu(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition((current) => current ? null : { top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  function runAction(action: () => void) {
    setMenuPosition(null);
    action();
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon" aria-label="Booking actions" aria-expanded={Boolean(menuPosition)} onClick={toggleMenu}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {menuPosition ? (
        <>
          <button type="button" className="fixed inset-0 z-[1490] cursor-default" aria-label="Close booking actions" onClick={() => setMenuPosition(null)} />
          <div className="fixed z-[1500] grid w-48 gap-1 rounded-xl border bg-card p-1 text-sm shadow-lg" style={{ top: menuPosition.top, right: menuPosition.right }}>
            {booking.status === "pending" ? <Button variant="ghost" className="justify-start" onClick={() => runAction(() => onStatus("accepted"))}>Accept</Button> : null}
            {booking.status === "pending" ? <Button variant="ghost" className="justify-start" onClick={() => runAction(onDecline)}>Decline</Button> : null}
            {booking.status === "pending" ? <Button variant="ghost" className="justify-start" onClick={() => runAction(onPropose)}>Propose alternative</Button> : null}
            {booking.status === "accepted" ? <Button variant="ghost" className="justify-start" onClick={() => runAction(() => onStatus("completed"))}>Mark completed</Button> : null}
            {booking.status === "accepted" ? <Button variant="ghost" className="justify-start" onClick={() => runAction(() => onStatus("no_show"))}>Mark no-show</Button> : null}
            {["accepted", "alternative_proposed"].includes(booking.status) ? <Button variant="ghost" className="justify-start" onClick={() => runAction(() => onStatus("cancelled"))}>Cancel</Button> : null}
          </div>
        </>
      ) : null}
    </>
  );
}
