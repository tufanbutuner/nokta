import { formatBookingRequestStatus } from "@/lib/bookingRequestLabels";
import { formatAdminVenueEnquiryStatus } from "@/lib/venueEnquiryLabels";
import type { OwnerInboxFilter, OwnerInboxItem, OwnerInboxTypeFilter } from "@/types/ownerInbox";

const OPEN_BOOKING_STATUSES = new Set(["pending", "accepted", "alternative_proposed", "customer_accepted_alternative"]);
const OPEN_ENQUIRY_STATUSES = new Set(["new", "contacted", "responded"]);

export function filterOwnerInboxItems(items: OwnerInboxItem[], filters: { status: OwnerInboxFilter; type: OwnerInboxTypeFilter; venueId: string }) {
  return items.filter((item) => {
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.venueId !== "all" && item.venueId !== filters.venueId) return false;
    if (filters.status === "needs-reply") return item.type === "booking" ? item.booking.status === "pending" : item.enquiry.status === "new";
    if (filters.status === "open") return item.type === "booking" ? OPEN_BOOKING_STATUSES.has(item.booking.status) : OPEN_ENQUIRY_STATUSES.has(item.enquiry.status);
    return item.type === "booking" ? !OPEN_BOOKING_STATUSES.has(item.booking.status) : !OPEN_ENQUIRY_STATUSES.has(item.enquiry.status);
  });
}

export function getOwnerInboxStatus(item: OwnerInboxItem) {
  if (item.type === "booking") return item.booking.status === "accepted" ? "Confirmed" : formatBookingRequestStatus(item.booking.status);
  return item.enquiry.status === "new" ? "New" : formatAdminVenueEnquiryStatus(item.enquiry.status);
}

export function getOwnerInboxStatusTone(item: OwnerInboxItem): "attention" | "progressed" | "closed" {
  if (item.type === "booking") {
    if (item.booking.status === "pending") return "attention";
    return OPEN_BOOKING_STATUSES.has(item.booking.status) ? "progressed" : "closed";
  }
  if (item.enquiry.status === "new") return "attention";
  return OPEN_ENQUIRY_STATUSES.has(item.enquiry.status) ? "progressed" : "closed";
}

export function getOwnerInboxName(item: OwnerInboxItem) {
  return item.type === "booking" ? item.booking.customerName : item.enquiry.customerName;
}

export function getOwnerInboxPreview(item: OwnerInboxItem) {
  if (item.type === "booking") {
    const date = new Date(`${item.booking.requestedDate}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    return `${date}, ${item.booking.requestedTime} · ${item.booking.partySize} people${item.booking.message ? ` · ${firstLine(item.booking.message)}` : ""}`;
  }
  return item.enquiry.hasFullAccess ? firstLine(item.enquiry.message ?? "No message supplied.") : "Upgrade to view enquiry details.";
}

export function relativeAge(value: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000));
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
}

function firstLine(value: string) {
  return value.split(/\r?\n/)[0]?.trim() || "No message supplied.";
}
