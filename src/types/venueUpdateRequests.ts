export type VenueUpdateRequestStatus = "pending" | "approved" | "rejected" | "cancelled" | "applied";

export interface VenueProfileUpdateChanges {
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  priceFrom?: number | null;
  openingHours?: unknown;
  features?: string[];
  vibes?: string[];
  menuUrl?: string | null;
  bookingUrl?: string | null;
  contactUrl?: string | null;
}

export interface VenueUpdateRequest {
  id: string;
  venueId: string;
  submittedBy: string;
  status: VenueUpdateRequestStatus;
  requestedChanges: VenueProfileUpdateChanges;
  originalSnapshot: VenueProfileUpdateChanges;
  requestNotes: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueUpdateRequestInput {
  venueId: string;
  requestedChanges: VenueProfileUpdateChanges;
  originalSnapshot: VenueProfileUpdateChanges;
  requestNotes?: string | null;
}
