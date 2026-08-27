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
  | "featured_placement_viewed"
  | "featured_placement_clicked"
  | "promoted_offer_viewed"
  | "promoted_offer_clicked"
  | "enquiry_cta_clicked"
  | "venue_enquiry_submitted"
  | "venue_enquiry_status_updated";

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
