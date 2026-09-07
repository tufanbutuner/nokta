import type { OwnerHomeSummary, OwnerHomeVenue } from "@/services/ownerHomeSummaryService";

export type OwnerHomeActionTone = "urgent" | "warning";

export interface OwnerHomeAction {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  to: string;
  tone: OwnerHomeActionTone;
}

const MAX_ACTIONS = 4;

export function getOwnerHomeActions(summary: OwnerHomeSummary): OwnerHomeAction[] {
  const actions: OwnerHomeAction[] = [];

  if (summary.pendingBookingRequests > 0) {
    actions.push({
      id: "booking-requests",
      title: `${summary.pendingBookingRequests} booking request${summary.pendingBookingRequests === 1 ? "" : "s"} waiting`,
      description: describeOldestBooking(summary.oldestPendingBookingAt),
      actionLabel: "Open bookings",
      to: "/owner/bookings",
      tone: "urgent",
    });
  }

  if (summary.newEnquiries > 0) {
    actions.push({
      id: "new-enquiries",
      title: `${summary.newEnquiries} new ${summary.newEnquiries === 1 ? "enquiry" : "enquiries"}`,
      description: "Customers are waiting for a reply.",
      actionLabel: "Open inbox",
      to: "/owner/enquiries",
      tone: "urgent",
    });
  }

  for (const venue of summary.venues) {
    if (venue.hasPricing) continue;
    actions.push({
      id: `no-pricing-${venue.id}`,
      title: `No prices on ${venue.name}`,
      description: "Customers filter and sort by price — venues without one are easy to miss.",
      actionLabel: "Add prices",
      to: `/owner/venues/${venue.slug}/update`,
      tone: "warning",
    });
  }

  for (const venue of summary.venues) {
    if (venue.approvedPhotoCount >= 3) continue;
    actions.push({
      id: `photos-${venue.id}`,
      title: `Only ${venue.approvedPhotoCount} photo${venue.approvedPhotoCount === 1 ? "" : "s"} on ${venue.name}`,
      description: "Profiles with three or more photos get more visits.",
      actionLabel: "Add photos",
      to: `/owner/venues/${venue.slug}/media`,
      tone: "warning",
    });
  }

  return actions.slice(0, MAX_ACTIONS);
}

export function getOwnerHomeGreeting(input: { hour: number; venues: OwnerHomeVenue[]; accountName?: string | null }): string {
  const timeOfDay = input.hour < 12 ? "morning" : input.hour < 18 ? "afternoon" : "evening";
  const name = input.venues.length === 1 ? input.venues[0].name : input.accountName;
  return name ? `Good ${timeOfDay}, ${name}` : `Good ${timeOfDay}`;
}

export function getOwnerHomeSubline(actionCount: number): string {
  if (actionCount === 0) return "Nothing needs you right now. Everything else is running.";
  return `${actionCount} thing${actionCount === 1 ? "" : "s"} need${actionCount === 1 ? "s" : ""} you. Everything else is running.`;
}

function describeOldestBooking(oldestAt: string | null): string {
  if (!oldestAt) return "Customers see “awaiting the venue” until you reply.";
  const days = Math.floor((Date.now() - new Date(oldestAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 1) return `Oldest sent ${days} day${days === 1 ? "" : "s"} ago`;
  return "Oldest sent today";
}
