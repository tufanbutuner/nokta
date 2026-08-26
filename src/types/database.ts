export interface VenueRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: string;
  city: string;
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  price_from: number | null;
  price_level: 1 | 2 | 3 | 4;
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  open_late: boolean;
  vibes: string[];
  images: string[];
  opening_hours: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  business_status: "open" | "temporarily-closed" | "permanently-closed" | "unknown";
  verification_status: "unverified" | "partially-verified" | "verified";
  last_verified_at: string | null;
  data_sources: Record<string, string>;
  source_notes: string | null;
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  partner_tier: "none" | "starter" | "growth" | "pro";
  monetisation_status: "not-contacted" | "contacted" | "interested" | "trial" | "paying" | "churned" | "not-fit";
  monetisation_notes: string | null;
  featured_eligible: boolean;
  featured_blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type VenueRowInput = Omit<VenueRow, "created_at" | "updated_at">;

export interface VenueReviewRow {
  id: string;
  venue_id: string;
  user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  body: string;
  visit_date: string | null;
  status: "published" | "hidden" | "flagged" | "deleted";
  moderation_notes: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueSuggestionRow {
  id: string;
  submitted_by: string | null;
  venue_name: string;
  country: string;
  city: string;
  area: string | null;
  address: string | null;
  postcode: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "converted";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueClaimRequestRow {
  id: string;
  venue_id: string;
  submitted_by: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  claimant_role: "owner" | "manager" | "employee" | "marketing" | "other";
  business_email: string | null;
  business_phone: string | null;
  proof_notes: string | null;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
