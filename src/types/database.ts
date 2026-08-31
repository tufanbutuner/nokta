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
  stripe_mode: "test" | "live" | null;
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

export interface VenueMediaRow {
  id: string;
  venue_id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  media_type: "image";
  source_type: "manual" | "venue-owned" | "stock" | "admin-uploaded" | "owner-uploaded";
  source_url: string | null;
  is_primary: boolean;
  sort_order: number;
  verification_status: "unverified" | "partially-verified" | "verified";
  uploaded_by: string | null;
  uploaded_by_role: "admin" | "owner" | null;
  review_status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRequestRow {
  id: string;
  venue_id: string;
  submitted_by: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  party_size: number;
  requested_date: string;
  requested_time: string;
  occasion: string | null;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "alternative_proposed" | "customer_accepted_alternative" | "customer_declined_alternative" | "cancelled" | "completed" | "no_show" | "spam";
  owner_response_message: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  proposed_message: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  proposed_at: string | null;
  cancelled_at: string | null;
  customer_access_token: string | null;
  customer_access_token_expires_at: string | null;
  customer_alternative_response_message: string | null;
  customer_responded_at: string | null;
  confirmed_at: string | null;
  confirmation_reference: string | null;
  owner_last_updated_by: string | null;
  owner_last_updated_at: string | null;
  admin_notes: string | null;
  source_surface: "venue_page" | "discover" | "city_page" | "saved_venues" | "recommendations" | "owner_preview" | "admin_preview" | null;
  created_at: string;
  updated_at: string;
}

export interface VenueBookingSettingsRow {
  id: string;
  venue_id: string;
  booking_requests_enabled: boolean;
  min_party_size: number;
  max_party_size: number;
  min_notice_minutes: number;
  max_advance_days: number;
  default_booking_duration_minutes: number;
  booking_instructions: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueBookingWindowRow {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueBookingBlackoutDateRow {
  id: string;
  venue_id: string;
  blackout_date: string;
  reason: string | null;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerPromotionRequestRow {
  id: string;
  venue_id: string;
  submitted_by: string;
  request_type: "promoted_offer" | "featured_placement";
  status: "pending" | "approved" | "rejected" | "cancelled" | "converted";
  title: string;
  description: string | null;
  terms: string | null;
  offer_type: "food" | "drink" | "birthday" | "group" | "football" | "student" | "private-hire" | "event" | "other" | null;
  placement_type: "homepage" | "city" | "area" | "discover" | "recommendation" | null;
  requested_city: string | null;
  requested_area: string | null;
  requested_starts_at: string | null;
  requested_ends_at: string | null;
  requested_priority: number;
  cta_label: string | null;
  cta_url: string | null;
  owner_notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_offer_id: string | null;
  created_featured_placement_id: string | null;
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
