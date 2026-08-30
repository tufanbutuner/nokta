import type { BookingRequestStatus } from "@/types/bookingRequests";

export function formatBookingRequestStatus(status: BookingRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "alternative_proposed":
      return "Alternative proposed";
    case "customer_accepted_alternative":
      return "Alternative accepted";
    case "customer_declined_alternative":
      return "Alternative declined";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "no_show":
      return "No-show";
    case "spam":
      return "Spam";
  }
}

export function formatBookingRequestDateTime(date: string, time: string): string {
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${dateLabel} at ${time}`;
}
