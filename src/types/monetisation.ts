export type PartnerTier = "none" | "starter" | "growth" | "pro";

export type MonetisationStatus = "not-contacted" | "contacted" | "interested" | "trial" | "paying" | "churned" | "not-fit";

export interface VenueMonetisationDetails {
  venueId: string;
  isClaimed: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
  partnerTier: PartnerTier;
  monetisationStatus: MonetisationStatus;
  monetisationNotes: string | null;
  featuredEligible: boolean;
  featuredBlockedReason: string | null;
}
