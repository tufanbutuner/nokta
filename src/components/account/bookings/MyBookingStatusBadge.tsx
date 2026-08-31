import { Badge } from "@/components/ui/badge";
import type { BookingRequestStatus } from "@/types/bookingRequests";

export function MyBookingStatusBadge({ status }: { status: BookingRequestStatus }) {
  const label = getLabel(status);
  const className = getClassName(status);
  return <Badge className={className}>{label}</Badge>;
}

function getLabel(status: BookingRequestStatus) {
  switch (status) {
    case "accepted":
    case "customer_accepted_alternative":
      return "Confirmed";
    case "alternative_proposed":
      return "Alternative proposed";
    case "customer_declined_alternative":
      return "Alternative declined";
    case "pending":
      return "Pending";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "no_show":
      return "No-show";
    case "spam":
      return "Unavailable";
  }
}

function getClassName(status: BookingRequestStatus) {
  if (status === "accepted" || status === "customer_accepted_alternative") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "alternative_proposed") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "declined" || status === "customer_declined_alternative" || status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-stone-200 bg-stone-50 text-stone-700";
}
