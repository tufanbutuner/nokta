export type VenueClaimRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type VenueClaimantRole = "owner" | "manager" | "employee" | "marketing" | "other";

export interface VenueClaimRequest {
  id: string;
  venueId: string;
  submittedBy: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string | null;
  claimantRole: VenueClaimantRole;
  businessEmail: string | null;
  businessPhone: string | null;
  proofNotes: string | null;
  proofUrl: string | null;
  status: VenueClaimRequestStatus;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueClaimRequestInput {
  venueId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string | null;
  claimantRole: VenueClaimantRole;
  businessEmail?: string | null;
  businessPhone?: string | null;
  proofNotes?: string | null;
  proofUrl?: string | null;
}
