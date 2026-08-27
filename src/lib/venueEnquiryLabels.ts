import type { VenueEnquiryStatus, VenueEnquiryType } from "@/types/venueEnquiries";

export function formatVenueEnquiryType(type: VenueEnquiryType): string {
  const labels: Record<VenueEnquiryType, string> = {
    general: "General enquiry",
    birthday: "Birthday booking",
    group: "Group booking",
    football: "Football night",
    "late-night": "Late-night booking",
    "private-hire": "Private hire",
  };
  return labels[type];
}

export function formatVenueEnquiryStatus(status: VenueEnquiryStatus): string {
  const labels: Record<VenueEnquiryStatus, string> = {
    new: "Sent",
    contacted: "Venue contacted",
    responded: "Responded",
    converted: "Converted",
    closed: "Closed",
    spam: "Spam",
  };
  return labels[status];
}

export function formatAdminVenueEnquiryStatus(status: VenueEnquiryStatus): string {
  return status === "new" ? "New" : formatVenueEnquiryStatus(status);
}
