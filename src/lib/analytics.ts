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
  | "venue_claim_rejected";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (import.meta.env.DEV) {
    console.info("[analytics]", event, compactProperties(properties));
  }
}

function compactProperties(properties?: AnalyticsProperties): AnalyticsProperties | undefined {
  if (!properties) {
    return undefined;
  }

  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}
