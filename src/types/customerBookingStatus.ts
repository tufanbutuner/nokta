import type { BookingRequestStatus } from "@/types/bookingRequests";

export interface CustomerBookingStatus {
  id: string;
  venueId: string;
  venueName: string;
  venueSlug: string;
  venueArea: string | null;
  venueCity: string | null;
  customerName: string;
  partySize: number;
  requestedDate: string;
  requestedTime: string;
  occasion: string | null;
  status: BookingRequestStatus;
  ownerResponseMessage: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  proposedMessage: string | null;
  customerAlternativeResponseMessage: string | null;
  customerRespondedAt: string | null;
  confirmedAt: string | null;
  confirmationReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBookingStatusRow {
  id: string;
  venue_id: string;
  venue_name: string;
  venue_slug: string;
  venue_area: string | null;
  venue_city: string | null;
  customer_name: string;
  party_size: number;
  requested_date: string;
  requested_time: string;
  occasion: string | null;
  status: BookingRequestStatus;
  owner_response_message: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  proposed_message: string | null;
  customer_alternative_response_message: string | null;
  customer_responded_at: string | null;
  confirmed_at: string | null;
  confirmation_reference: string | null;
  created_at: string;
  updated_at: string;
}
