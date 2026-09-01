import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getAdminVenueAnalyticsEvents } from "@/services/adminVenueAnalyticsService";
import type { VenueAnalyticsEventName, VenueAnalyticsEventRow } from "@/types/analytics";

export type OwnerAnalyticsDateRange = "last_7_days" | "last_30_days" | "this_month" | "last_month" | "all_time";

export interface OwnerVenueAnalyticsDailySummary {
  date: string;
  profileViews: number;
  bookingRequests: number;
  enquiries: number;
  customerActions: number;
}

export interface OwnerVenueAnalyticsSummary {
  venueId: string;
  dateRange: OwnerAnalyticsDateRange;
  profileViews: number;
  bookingCtaClicks: number;
  bookingRequests: number;
  enquiries: number;
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
  promotedOfferViews: number;
  promotedOfferClicks: number;
  featuredPlacementViews: number;
  featuredPlacementClicks: number;
  totalEvents: number;
  customerActions: number;
  conversionRate: number | null;
  bookingCtaRate: number | null;
  bookingSubmitRate: number | null;
  directionsClickRate: number;
  websiteClickRate: number;
  enquiryConversionRate: number;
  featuredClickRate: number;
  offerClickRate: number;
  daily: OwnerVenueAnalyticsDailySummary[];
  previous?: {
    profileViews: number;
    bookingRequests: number;
    enquiries: number;
    customerActions: number;
  };
}

export function getOwnerAnalyticsDateRange(range: OwnerAnalyticsDateRange): { from: string; to: string; previousFrom?: string; previousTo?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "all_time") {
    return { from: new Date(0).toISOString(), to: now.toISOString() };
  }

  if (range === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousTo = new Date(from.getTime() - 1);
    return { from: from.toISOString(), to: now.toISOString(), previousFrom: previousFrom.toISOString(), previousTo: previousTo.toISOString() };
  }

  if (range === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const previousFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const previousTo = new Date(from.getTime() - 1);
    return { from: from.toISOString(), to: to.toISOString(), previousFrom: previousFrom.toISOString(), previousTo: previousTo.toISOString() };
  }

  const days = range === "last_7_days" ? 7 : 30;
  const from = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  return { from: from.toISOString(), to: now.toISOString(), previousFrom: previousFrom.toISOString(), previousTo: previousTo.toISOString() };
}

export async function getOwnerVenueAnalyticsSummary(input: {
  userId: string;
  venueId: string;
  dateRange?: OwnerAnalyticsDateRange;
  from?: string;
  to?: string;
}): Promise<OwnerVenueAnalyticsSummary> {
  const dateRange = input.dateRange ?? "last_30_days";
  const range = input.from && input.to ? { from: input.from, to: input.to } : getOwnerAnalyticsDateRange(dateRange);
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You do not have access to this venue dashboard.");

  const [events, previousEvents] = await Promise.all([
    getAdminVenueAnalyticsEvents({ venueId: input.venueId, from: range.from, to: range.to }),
    range.previousFrom && range.previousTo ? getAdminVenueAnalyticsEvents({ venueId: input.venueId, from: range.previousFrom, to: range.previousTo }).catch(() => []) : Promise.resolve([]),
  ]);

  return withPrevious(buildSummary(input.venueId, dateRange, events), previousEvents);
}

function buildSummary(venueId: string, dateRange: OwnerAnalyticsDateRange, events: VenueAnalyticsEventRow[]): OwnerVenueAnalyticsSummary {
  const summary = createSummary(venueId, dateRange);
  const daily = new Map<string, OwnerVenueAnalyticsDailySummary>();

  events.forEach((event) => {
    addEventToSummary(summary, event.event_name);
    const date = event.created_at.slice(0, 10);
    const day = daily.get(date) ?? { date, profileViews: 0, bookingRequests: 0, enquiries: 0, customerActions: 0 };
    addEventToDailySummary(day, event.event_name);
    daily.set(date, day);
  });

  summary.daily = Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));
  return withRates(summary);
}

function withPrevious(summary: OwnerVenueAnalyticsSummary, previousEvents: VenueAnalyticsEventRow[]) {
  if (!previousEvents.length) return summary;
  const previous = buildSummary(summary.venueId, summary.dateRange, previousEvents);
  return {
    ...summary,
    previous: {
      profileViews: previous.profileViews,
      bookingRequests: previous.bookingRequests,
      enquiries: previous.enquiries,
      customerActions: previous.customerActions,
    },
  };
}

function createSummary(venueId: string, dateRange: OwnerAnalyticsDateRange): OwnerVenueAnalyticsSummary {
  return {
    venueId,
    dateRange,
    profileViews: 0,
    bookingCtaClicks: 0,
    bookingRequests: 0,
    enquiries: 0,
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
    promotedOfferViews: 0,
    promotedOfferClicks: 0,
    featuredPlacementViews: 0,
    featuredPlacementClicks: 0,
    totalEvents: 0,
    customerActions: 0,
    conversionRate: null,
    bookingCtaRate: null,
    bookingSubmitRate: null,
    directionsClickRate: 0,
    websiteClickRate: 0,
    enquiryConversionRate: 0,
    featuredClickRate: 0,
    offerClickRate: 0,
    daily: [],
  };
}

function addEventToSummary(summary: OwnerVenueAnalyticsSummary, eventName: VenueAnalyticsEventName) {
  summary.totalEvents += 1;
  if (eventName === "venue_profile_viewed") summary.profileViews += 1;
  if (eventName === "venue_booking_cta_clicked") summary.bookingCtaClicks += 1;
  if (eventName === "venue_booking_request_submitted") summary.bookingRequests += 1;
  if (eventName === "venue_enquiry_cta_clicked") summary.enquiryCtaClicks += 1;
  if (eventName === "venue_enquiry_submitted") {
    summary.enquiries += 1;
    summary.enquirySubmissions += 1;
  }
  if (eventName === "venue_directions_clicked") summary.directionsClicks += 1;
  if (eventName === "venue_website_clicked") summary.websiteClicks += 1;
  if (eventName === "venue_instagram_clicked") summary.instagramClicks += 1;
  if (eventName === "venue_saved") summary.saves += 1;
  if (eventName === "featured_placement_viewed") {
    summary.featuredViews += 1;
    summary.featuredPlacementViews += 1;
  }
  if (eventName === "featured_placement_clicked") {
    summary.featuredClicks += 1;
    summary.featuredPlacementClicks += 1;
  }
  if (eventName === "promoted_offer_viewed") {
    summary.offerViews += 1;
    summary.promotedOfferViews += 1;
  }
  if (eventName === "promoted_offer_clicked") {
    summary.offerClicks += 1;
    summary.promotedOfferClicks += 1;
  }
}

function addEventToDailySummary(day: OwnerVenueAnalyticsDailySummary, eventName: VenueAnalyticsEventName) {
  if (eventName === "venue_profile_viewed") day.profileViews += 1;
  if (eventName === "venue_booking_request_submitted") day.bookingRequests += 1;
  if (eventName === "venue_enquiry_submitted") day.enquiries += 1;
  if (isCustomerAction(eventName)) day.customerActions += 1;
}

function withRates(summary: OwnerVenueAnalyticsSummary): OwnerVenueAnalyticsSummary {
  const customerActions = summary.directionsClicks + summary.websiteClicks + summary.instagramClicks + summary.saves;

  return {
    ...summary,
    customerActions,
    conversionRate: nullableRate(summary.bookingRequests, summary.profileViews),
    bookingCtaRate: nullableRate(summary.bookingCtaClicks, summary.profileViews),
    bookingSubmitRate: nullableRate(summary.bookingRequests, summary.bookingCtaClicks),
    directionsClickRate: rate(summary.directionsClicks, summary.profileViews),
    websiteClickRate: rate(summary.websiteClicks, summary.profileViews),
    enquiryConversionRate: rate(summary.enquirySubmissions, summary.profileViews),
    featuredClickRate: rate(summary.featuredClicks, summary.featuredViews),
    offerClickRate: rate(summary.offerClicks, summary.offerViews),
  };
}

function isCustomerAction(eventName: VenueAnalyticsEventName) {
  return eventName === "venue_directions_clicked" || eventName === "venue_website_clicked" || eventName === "venue_instagram_clicked" || eventName === "venue_saved";
}

function nullableRate(value: number, total: number) {
  if (!total) return null;
  return rate(value, total);
}

function rate(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}
