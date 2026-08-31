import { trackEvent } from "@/lib/analytics";
import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";
import { MyBookingCard } from "./MyBookingCard";
import type { MyBookingsFilterValue } from "./MyBookingsFilters";

const GROUPS: { id: Exclude<MyBookingsFilterValue, "all">; title: string; statuses: BookingRequestStatus[] }[] = [
  { id: "action_needed", title: "Action needed", statuses: ["alternative_proposed"] },
  { id: "upcoming", title: "Upcoming", statuses: ["accepted", "customer_accepted_alternative"] },
  { id: "pending", title: "Pending", statuses: ["pending"] },
  { id: "past", title: "Past / Closed", statuses: ["declined", "customer_declined_alternative", "cancelled", "completed", "no_show", "spam"] },
];

export function MyBookingsList({ bookings, venuesById, filter }: { bookings: BookingRequest[]; venuesById: Record<string, Venue | undefined>; filter: MyBookingsFilterValue }) {
  const visibleGroups = GROUPS.filter((group) => filter === "all" || filter === group.id);

  return (
    <div className="space-y-6">
      {visibleGroups.map((group) => {
        const groupBookings = bookings.filter((booking) => group.statuses.includes(booking.status));
        if (!groupBookings.length && filter !== group.id) return null;
        return (
          <section key={group.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-brand text-2xl font-bold tracking-[-0.5px]">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{groupBookings.length} booking{groupBookings.length === 1 ? "" : "s"}</p>
            </div>
            {groupBookings.length ? (
              <div className="grid gap-3">
                {groupBookings.map((booking) => (
                  <MyBookingCard key={booking.id} booking={booking} venue={venuesById[booking.venueId]} onOpen={() => trackEvent("customer_booking_card_clicked", { status: booking.status })} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No bookings in this section.</div>
            )}
          </section>
        );
      })}
    </div>
  );
}
