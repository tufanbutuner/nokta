import type { BookingRequest } from "@/types/bookingRequests";
import type { VenueEnquiry, VenueEnquiryStatus, VenueEnquiryType } from "@/types/venueEnquiries";

export type OwnerInboxFilter = "needs-reply" | "open" | "closed";
export type OwnerInboxTypeFilter = "all" | "booking" | "enquiry";

export interface OwnerInboxEnquirySummary {
  id: string;
  venueId: string;
  enquiryType: VenueEnquiryType;
  partySize: number | null;
  preferredDate: string | null;
  preferredTime: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  message: string | null;
  status: VenueEnquiryStatus;
  venueResponse: string | null;
  createdAt: string;
  updatedAt: string;
  hasFullAccess: boolean;
}

export type OwnerInboxItem =
  | { id: string; type: "booking"; venueId: string; createdAt: string; booking: BookingRequest }
  | { id: string; type: "enquiry"; venueId: string; createdAt: string; enquiry: OwnerInboxEnquirySummary; fullEnquiry?: VenueEnquiry };
