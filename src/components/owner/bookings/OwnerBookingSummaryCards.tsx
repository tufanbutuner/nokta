import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";

const STATUSES: BookingRequestStatus[] = ["pending", "accepted", "alternative_proposed", "completed", "no_show"];

export function OwnerBookingSummaryCards({ bookings }: { bookings: BookingRequest[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {STATUSES.map((status) => <Metric key={status} label={status.replace(/_/g, " ")} value={bookings.filter((booking) => booking.status === status).length} />)}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm capitalize text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
