import { capturePostHogEvent, capturePostHogPageView } from "@/lib/posthogClient";
import { insertVenueAnalyticsEvent } from "@/services/venueAnalyticsEventService";
import type { VenueAnalyticsEventInput } from "@/types/analytics";

export type AnalyticsEvent =
  | "venue_viewed"
  | "venue_saved"
  | "venue_unsaved"
  | "directions_clicked"
  | "website_clicked"
  | "instagram_clicked"
  | "discover_search_used"
  | "discover_filter_changed"
  | "location_enabled"
  | "recommendation_started"
  | "recommendation_completed"
  | "review_created"
  | "review_updated"
  | "suggestion_submitted"
  | "venue_claim_started"
  | "venue_claim_submitted"
  | "venue_claim_cancelled"
  | "venue_claim_approved"
  | "venue_claim_rejected"
  | "owner_dashboard_viewed"
  | "owner_venue_dashboard_viewed"
  | "owner_public_venue_link_clicked"
  | "owner_contact_sheesha_clicked"
  | "owner_profile_update_started"
  | "owner_profile_update_submitted"
  | "owner_profile_update_cancelled"
  | "owner_upgrade_prompt_viewed"
  | "owner_upgrade_prompt_clicked"
  | "owner_pricing_viewed"
  | "owner_checkout_started"
  | "owner_checkout_redirected"
  | "owner_checkout_success_viewed"
  | "owner_billing_page_viewed"
  | "owner_billing_portal_opened"
  | "stripe_subscription_activated"
  | "stripe_subscription_updated"
  | "stripe_subscription_cancelled"
  | "stripe_payment_failed"
  | "admin_profile_update_approved"
  | "admin_profile_update_rejected"
  | "admin_profile_update_applied"
  | "admin_subscription_plan_updated"
  | "admin_subscription_trial_started"
  | "admin_subscription_cancelled"
  | "featured_placement_viewed"
  | "featured_placement_clicked"
  | "promoted_offer_viewed"
  | "promoted_offer_clicked"
  | "enquiry_cta_clicked"
  | "venue_enquiry_submitted"
  | "venue_enquiry_status_updated"
  | "owner_enquiry_inbox_viewed"
  | "owner_enquiry_viewed"
  | "owner_enquiry_status_updated"
  | "owner_enquiry_marked_converted"
  | "owner_enquiry_upgrade_prompt_viewed"
  | "owner_enquiry_upgrade_prompt_clicked"
  | "owner_promotions_viewed"
  | "owner_promotion_request_started"
  | "owner_promotion_request_submitted"
  | "owner_promotion_request_cancelled"
  | "owner_promotion_upgrade_prompt_viewed"
  | "owner_promotion_upgrade_prompt_clicked"
  | "admin_promotion_request_approved"
  | "admin_promotion_request_rejected"
  | "admin_promotion_request_converted"
  | "owner_media_page_viewed"
  | "owner_media_upload_started"
  | "owner_media_upload_completed"
  | "owner_media_upload_failed"
  | "owner_media_metadata_updated"
  | "owner_media_pending_deleted"
  | "admin_media_review_viewed"
  | "admin_media_approved"
  | "admin_media_rejected";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  try {
    const nextProperties = compactProperties(properties);
    capturePostHogEvent(event, nextProperties);
    if (import.meta.env.DEV) {
      console.info("[analytics]", event, nextProperties);
    }
  } catch {
    return;
  }
}

export function trackPageView(path: string): void {
  try {
    capturePostHogPageView(path);
    if (import.meta.env.DEV) {
      console.info("[pageview]", path);
    }
  } catch {
    return;
  }
}

export function trackVenueAnalyticsEvent(input: VenueAnalyticsEventInput): void {
  void insertVenueAnalyticsEvent(input).catch((error) => {
    if (import.meta.env.DEV) {
      console.info("[venue analytics]", error instanceof Error ? error.message : "Could not insert venue analytics event.");
    }
  });
}

function compactProperties(properties?: AnalyticsProperties): AnalyticsProperties | undefined {
  if (!properties) {
    return undefined;
  }

  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}
