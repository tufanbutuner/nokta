import { getAnalyticsEnvironment } from "@/lib/analyticsEnvironment";
import { getAnonymousUserId, getSessionId } from "@/lib/analyticsIdentity";
import { sanitiseAnalyticsMetadata } from "@/lib/analyticsSanitise";
import { supabase } from "@/lib/supabase";
import type { VenueAnalyticsEventInput } from "@/types/analytics";

export async function insertVenueAnalyticsEvent(input: VenueAnalyticsEventInput): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("venue_analytics_events").insert({
    venue_id: input.venueId ?? null,
    event_name: input.eventName,
    city: input.city ?? null,
    area: input.area ?? null,
    source_surface: input.sourceSurface ?? null,
    placement_id: input.placementId ?? null,
    offer_id: input.offerId ?? null,
    enquiry_id: input.enquiryId ?? null,
    anonymous_user_id: getAnonymousUserId(),
    session_id: getSessionId(),
    metadata: sanitiseAnalyticsMetadata(input.metadata ?? {}),
    // Stamped on write so reporting can count real traffic only.
    environment: getAnalyticsEnvironment(),
  });

  if (error && import.meta.env.DEV) {
    console.info("[venue analytics]", error.message);
  }
}
