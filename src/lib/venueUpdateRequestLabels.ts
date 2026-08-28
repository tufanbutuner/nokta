import type { VenueUpdateRequestStatus } from "@/types/venueUpdateRequests";

export function formatVenueUpdateRequestStatus(status: VenueUpdateRequestStatus): string {
  switch (status) {
    case "pending": return "Pending review";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "cancelled": return "Cancelled";
    case "applied": return "Applied";
  }
}
