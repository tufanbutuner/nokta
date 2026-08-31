import type { BookingRequestStatus } from "@/types/bookingRequests";
import type { CustomerBookingStatus } from "@/types/customerBookingStatus";

export function getCustomerBookingStatusCopy(status: BookingRequestStatus): { title: string; description: string } {
  switch (status) {
    case "pending":
      return { title: "Booking request sent", description: "The venue has received your request. Your booking is not confirmed yet." };
    case "accepted":
      return { title: "Booking confirmed", description: "The venue accepted your requested date and time." };
    case "declined":
      return { title: "Booking declined", description: "The venue was unable to accept this request." };
    case "alternative_proposed":
      return { title: "Venue proposed another time", description: "Review the new time and choose whether it works for you." };
    case "customer_accepted_alternative":
      return { title: "Booking confirmed", description: "You accepted the venue's alternative time." };
    case "customer_declined_alternative":
      return { title: "Alternative declined", description: "You declined the venue's alternative time." };
    case "cancelled":
      return { title: "Booking cancelled", description: "This booking is no longer active." };
    case "completed":
      return { title: "Booking completed", description: "This booking has been marked as completed." };
    case "no_show":
      return { title: "Booking marked as no-show", description: "The venue marked this booking as a no-show." };
    case "spam":
      return { title: "Booking unavailable", description: "This booking status is unavailable." };
  }
}

export function isCustomerBookingConfirmed(booking: CustomerBookingStatus): boolean {
  return Boolean(booking.confirmedAt) || booking.status === "accepted" || booking.status === "customer_accepted_alternative";
}

export function canCustomerRespondToAlternative(booking: CustomerBookingStatus): boolean {
  return booking.status === "alternative_proposed" && Boolean(booking.proposedDate && booking.proposedTime);
}
