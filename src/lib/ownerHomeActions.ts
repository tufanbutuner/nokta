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
      to: "/owner/inbox",
      tone: "urgent",
    });
  }

  for (const venue of summary.venues) {
    if (venue.liveMenuItemCount > 0) continue;
    actions.push({
      id: `no-menu-${venue.id}`,
      title: `No menu or prices on ${venue.name}`,
      description: "Customers filter and sort by price — venues without one are easy to miss.",
      actionLabel: "Add menu",
      to: `/owner/venues/${venue.slug}/menu`,
      tone: "warning",
    });
  }

  for (const venue of summary.venues) {
    if (!venue.liveMenuItemCount) continue;
    const months = monthsSince(venue.menuLastUpdatedAt);
    if (months === null || months < 3) continue;
    actions.push({
      id: `stale-menu-${venue.id}`,
      title: `Your prices are ${months} months old`,
      description: `Last changed ${formatDate(venue.menuLastUpdatedAt)} on ${venue.name}.`,
      actionLabel: "Check menu",
      to: `/owner/venues/${venue.slug}/menu`,
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
      to: `/owner/venues/${venue.slug}/photos`,
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

/** Whole months since a timestamp, for the "prices are N months old" rule. */
function monthsSince(value: string | null): number | null {
  if (!value) return null;
  const days = (Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(days)) return null;
  return Math.floor(days / 30);
}

function formatDate(value: string | null): string {
  if (!value) return "a while ago";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function describeOldestBooking(oldestAt: string | null): string {
  if (!oldestAt) return "Customers see “awaiting the venue” until you reply.";
  const days = Math.floor((Date.now() - new Date(oldestAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 1) return `Oldest sent ${days} day${days === 1 ? "" : "s"} ago`;
  return "Oldest sent today";
}
