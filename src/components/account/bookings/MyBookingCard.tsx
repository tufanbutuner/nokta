import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatBookingRequestDateTime } from "@/lib/bookingRequestLabels";
import type { BookingRequest } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";
import { MyBookingStatusBadge } from "./MyBookingStatusBadge";

export function MyBookingCard({ booking, venue, onOpen }: { booking: BookingRequest; venue?: Venue; onOpen: (booking: BookingRequest) => void }) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-brand text-xl font-bold tracking-[-0.5px]">{venue?.name ?? booking.venueId}</h3>
            <MyBookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{venue ? `${venue.area} • ${venue.city}` : "Venue details unavailable"}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-semibold">{booking.confirmationReference ?? "Reference pending"}</p>
          <p className="mt-1 text-muted-foreground">Submitted {new Date(booking.createdAt).toLocaleDateString("en-GB")}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <Detail label="Date and time" value={formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)} />
        <Detail label="Party size" value={`${booking.partySize} people`} />
        <Detail label="Occasion" value={booking.occasion ?? "General"} />
      </div>
      <div className="mt-4">
        {booking.customerAccessToken ? (
          <Button asChild variant="outline" onClick={() => onOpen(booking)}>
            <Link to={`/booking-status/${booking.customerAccessToken}`} className="gap-2">
              View booking status
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Booking status link unavailable</p>
        )}
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/30 p-3"><span className="block text-xs uppercase text-muted-foreground">{label}</span><strong className="mt-1 block">{value}</strong></div>;
}
