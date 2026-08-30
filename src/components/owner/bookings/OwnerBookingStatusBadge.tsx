import { formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import { cn } from "@/lib/utils";
import type { BookingRequestStatus } from "@/types/bookingRequests";

export function OwnerBookingStatusBadge({ status }: { status: BookingRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-xs font-medium",
        status === "pending" && "bg-amber-50 text-amber-900",
        status === "accepted" && "bg-emerald-50 text-emerald-800",
        status === "alternative_proposed" && "bg-blue-50 text-blue-800",
        ["declined", "cancelled", "no_show", "spam"].includes(status) && "bg-stone-100 text-stone-700",
      )}
    >
      {formatBookingRequestStatus(status)}
    </span>
  );
}
