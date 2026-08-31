import { formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import type { BookingRequestStatus } from "@/types/bookingRequests";

export function getBookingCalendarEventLabel(input: { time: string; partySize: number; status: BookingRequestStatus }): string {
  return `${input.time} • ${input.partySize} people • ${formatBookingRequestStatus(input.status)}`;
}

export function getBookingCalendarStatusTone(status: BookingRequestStatus): "default" | "pending" | "alternative" | "success" | "muted" | "destructive" {
  if (status === "pending") return "pending";
  if (status === "alternative_proposed") return "alternative";
  if (status === "accepted" || status === "customer_accepted_alternative") return "success";
  if (status === "declined" || status === "customer_declined_alternative" || status === "cancelled" || status === "no_show" || status === "spam") return "destructive";
  if (status === "completed") return "muted";
  return "default";
}
