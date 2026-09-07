export type VenueUpdateRequestStatus = "pending" | "approved" | "rejected" | "cancelled" | "applied";

/**
 * Fields that still route through admin review. Menu items, prices and the
 * three menu links are owner-owned and publish immediately — see
 * venueMenuService.ts.
 */
export interface VenueProfileUpdateChanges {
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  openingHours?: unknown;
  features?: string[];
  vibes?: string[];
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
