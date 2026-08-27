import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getAdminVenueAnalyticsEvents } from "@/services/adminVenueAnalyticsService";

export interface OwnerVenueAnalyticsSummary {
  venueId: string;
  profileViews: number;
  directionsClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  saves: number;
  enquiryCtaClicks: number;
  enquirySubmissions: number;
  featuredViews: number;
  featuredClicks: number;
  offerViews: number;
  offerClicks: number;
  totalEvents: number;
  directionsClickRate: number;
  websiteClickRate: number;
  enquiryConversionRate: number;
  featuredClickRate: number;
  offerClickRate: number;
}

export async function getOwnerVenueAnalyticsSummary(input: { userId: string; venueId: string; from: string; to: string }): Promise<OwnerVenueAnalyticsSummary> {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You do not have access to this venue dashboard.");

  const events = await getAdminVenueAnalyticsEvents({ venueId: input.venueId, from: input.from, to: input.to });
  const summary = createSummary(input.venueId);
  events.forEach((event) => {
    summary.totalEvents += 1;
    if (event.event_name === "venue_profile_viewed") summary.profileViews += 1;
    if (event.event_name === "venue_directions_clicked") summary.directionsClicks += 1;
    if (event.event_name === "venue_website_clicked") summary.websiteClicks += 1;
    if (event.event_name === "venue_instagram_clicked") summary.instagramClicks += 1;
    if (event.event_name === "venue_saved") summary.saves += 1;
    if (event.event_name === "venue_enquiry_cta_clicked") summary.enquiryCtaClicks += 1;
    if (event.event_name === "venue_enquiry_submitted") summary.enquirySubmissions += 1;
    if (event.event_name === "featured_placement_viewed") summary.featuredViews += 1;
    if (event.event_name === "featured_placement_clicked") summary.featuredClicks += 1;
    if (event.event_name === "promoted_offer_viewed") summary.offerViews += 1;
    if (event.event_name === "promoted_offer_clicked") summary.offerClicks += 1;
  });

  return withRates(summary);
}

function createSummary(venueId: string): OwnerVenueAnalyticsSummary {
  return {
    venueId,
    profileViews: 0,
    directionsClicks: 0,
    websiteClicks: 0,
    instagramClicks: 0,
    saves: 0,
    enquiryCtaClicks: 0,
    enquirySubmissions: 0,
    featuredViews: 0,
    featuredClicks: 0,
    offerViews: 0,
    offerClicks: 0,
    totalEvents: 0,
    directionsClickRate: 0,
    websiteClickRate: 0,
    enquiryConversionRate: 0,
    featuredClickRate: 0,
    offerClickRate: 0,
  };
}

function withRates(summary: OwnerVenueAnalyticsSummary): OwnerVenueAnalyticsSummary {
  return {
    ...summary,
    directionsClickRate: rate(summary.directionsClicks, summary.profileViews),
    websiteClickRate: rate(summary.websiteClicks, summary.profileViews),
    enquiryConversionRate: rate(summary.enquirySubmissions, summary.profileViews),
    featuredClickRate: rate(summary.featuredClicks, summary.featuredViews),
    offerClickRate: rate(summary.offerClicks, summary.offerViews),
  };
}

function rate(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}
