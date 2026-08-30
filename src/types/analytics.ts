export type VenueAnalyticsEventName =
  | "venue_profile_viewed"
  | "venue_directions_clicked"
  | "venue_website_clicked"
  | "venue_instagram_clicked"
  | "venue_saved"
  | "venue_unsaved"
  | "venue_enquiry_cta_clicked"
  | "venue_enquiry_submitted"
  | "venue_enquiry_converted"
  | "venue_booking_cta_clicked"
  | "venue_booking_request_submitted"
  | "venue_booking_request_accepted"
  | "venue_booking_request_declined"
  | "venue_booking_alternative_proposed"
  | "featured_placement_viewed"
  | "featured_placement_clicked"
  | "promoted_offer_viewed"
  | "promoted_offer_clicked";

export type AnalyticsSourceSurface = "homepage" | "city_page" | "discover" | "venue_page" | "recommendations" | "saved_venues" | "account" | "owner_preview" | "admin_preview";

export interface VenueAnalyticsEventInput {
  venueId?: string | null;
  eventName: VenueAnalyticsEventName;
  city?: string | null;
  area?: string | null;
  sourceSurface?: AnalyticsSourceSurface | null;
  placementId?: string | null;
  offerId?: string | null;
  enquiryId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface VenueAnalyticsSummary {
  venueId: string;
  venueName?: string;
  city?: string | null;
  area?: string | null;
  profileViews: number;
  directionsClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  saves: number;
  unsaves: number;
  enquiryCtaClicks: number;
  enquirySubmissions: number;
  featuredViews: number;
  featuredClicks: number;
  offerViews: number;
  offerClicks: number;
  totalEvents: number;
}

export interface VenueAnalyticsEventRow {
  id: string;
  venue_id: string | null;
  event_name: VenueAnalyticsEventName;
  city: string | null;
  area: string | null;
  source_surface: AnalyticsSourceSurface | null;
  placement_id: string | null;
  offer_id: string | null;
  enquiry_id: string | null;
  anonymous_user_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
