import type { VenueClaimRequestRow } from "@/types/database";
import type { VenueClaimRequest } from "@/types/venueClaims";

export function mapVenueClaimRequestRowToClaimRequest(row: VenueClaimRequestRow): VenueClaimRequest {
  return {
    id: row.id,
    venueId: row.venue_id,
    submittedBy: row.submitted_by,
    claimantName: row.claimant_name,
    claimantEmail: row.claimant_email,
    claimantPhone: row.claimant_phone,
    claimantRole: row.claimant_role,
    businessEmail: row.business_email,
    businessPhone: row.business_phone,
    proofNotes: row.proof_notes,
    proofUrl: row.proof_url,
    status: row.status,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
