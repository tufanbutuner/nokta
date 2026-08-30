export type BookingRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "alternative_proposed"
  | "customer_accepted_alternative"
  | "customer_declined_alternative"
  | "cancelled"
  | "completed"
  | "no_show"
  | "spam";

export type BookingSourceSurface = "venue_page" | "discover" | "city_page" | "saved_venues" | "recommendations" | "owner_preview" | "admin_preview";

export interface BookingRequest {
  id: string;
  venueId: string;
  submittedBy: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  partySize: number;
  requestedDate: string;
  requestedTime: string;
  occasion: string | null;
  message: string | null;
  status: BookingRequestStatus;
  ownerResponseMessage: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  proposedMessage: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  proposedAt: string | null;
  cancelledAt: string | null;
  ownerLastUpdatedBy: string | null;
  ownerLastUpdatedAt: string | null;
  adminNotes: string | null;
  sourceSurface: BookingSourceSurface | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequestInput {
  venueId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  partySize: number;
  requestedDate: string;
  requestedTime: string;
  occasion?: string | null;
  message?: string | null;
  sourceSurface?: BookingSourceSurface | null;
}

export interface OwnerBookingRequestActionInput {
  bookingRequestId: string;
  ownerUserId: string;
  responseMessage?: string | null;
}

export interface OwnerProposeAlternativeInput {
  bookingRequestId: string;
  ownerUserId: string;
  proposedDate: string;
  proposedTime: string;
  proposedMessage?: string | null;
}
