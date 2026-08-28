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
  is_test: boolean;
  created_at: string;
  updated_at: string;
}

export type VenueRowInput = Omit<VenueRow, "created_at" | "updated_at">;

export interface VenueSubscriptionRow {
  id: string;
  venue_id: string;
  plan: "free" | "starter" | "growth" | "pro";
  status: "inactive" | "trial" | "active" | "past_due" | "cancelled";
  billing_provider: "manual" | "stripe" | null;
  billing_customer_id: string | null;
  billing_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  cancel_at_period_end: boolean;
  last_stripe_event_id: string | null;
  last_synced_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  admin_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface FeaturedPlacementRow {
  id: string;
  venue_id: string;
  placement_type: "homepage" | "city" | "area" | "discover" | "recommendation";
  city: string | null;
  area: string | null;
  title: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "paused" | "expired" | "cancelled";
  priority: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotedOfferRow {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  terms: string | null;
  offer_type: "food" | "drink" | "birthday" | "group" | "football" | "student" | "private-hire" | "event" | "other";
  city: string | null;
  area: string | null;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "paused" | "expired" | "cancelled";
  priority: number;
  cta_label: string | null;
  cta_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueEnquiryRow {
  id: string;
  venue_id: string;
  submitted_by: string | null;
  enquiry_type: "general" | "birthday" | "group" | "football" | "late-night" | "private-hire";
  party_size: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string | null;
  status: "new" | "contacted" | "responded" | "converted" | "closed" | "spam";
  admin_notes: string | null;
  assigned_to: string | null;
  contacted_venue_at: string | null;
  venue_response: string | null;
  resolved_at: string | null;
  owner_last_updated_by: string | null;
  owner_last_updated_at: string | null;
  owner_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueUpdateRequestRow {
  id: string;
  venue_id: string;
  submitted_by: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "applied";
  requested_changes: Record<string, unknown>;
  original_snapshot: Record<string, unknown>;
  request_notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}
