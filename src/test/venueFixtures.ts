import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

/** Shared fixtures for venue search and details tests. */

export const SITE_URL = "https://www.nokta.uk";
// Friday morning; the searched date below is the Saturday after.
export const NOW = new Date("2026-10-23T10:00:00");
export const SATURDAY = "2026-10-24";

export function venue(overrides: Partial<Venue> & Pick<Venue, "id" | "name">): Venue {
  return {
    slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    description: "A shisha lounge.",
    country: "United Kingdom",
    city: "London",
    area: "Soho",
    address: "1 Example Street",
    postcode: "W1D 1AA",
    latitude: 51.51,
    longitude: -0.13,
    priceLevel: 2,
    primaryCategory: "shisha_lounge",
    secondaryCategories: [],
    indoor: true,
    outdoor: false,
    food: false,
    alcohol: false,
    halal: true,
    openLate: true,
    vibes: [],
    images: [],
    openingHours: [],
    businessStatus: "open",
    verificationStatus: "unverified",
    dataSources: {},
    isClaimed: true,
    claimedBy: null,
    claimedAt: null,
    partnerTier: "none",
    monetisationStatus: "not-contacted",
    monetisationNotes: null,
    featuredEligible: true,
    featuredBlockedReason: null,
    isTest: false,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

export function placement(venueId: string, priority: number): FeaturedPlacement {
  return { id: `p-${venueId}`, venueId, placementType: "city", city: "London", area: null, title: null, description: null, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-11-01T00:00:00Z", status: "active", priority, createdBy: null, updatedBy: null, createdAt: "", updatedAt: "" };
}

export function offer(venueId: string): PromotedOffer {
  return { id: `o-${venueId}`, venueId, title: "2-for-1 shisha", description: "Before 8pm", terms: null, offerType: "other", city: "London", area: null, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-11-01T00:00:00Z", status: "active", priority: 1, ctaLabel: null, ctaUrl: null, createdBy: null, updatedBy: null, createdAt: "", updatedAt: "" };
}

export function saturdayAvailability(venueId: string, bookedSlots: { date: string; time: string }[] = []): VenueBookingAvailability {
  return {
    settings: { id: `s-${venueId}`, venueId, bookingRequestsEnabled: true, minPartySize: 1, maxPartySize: 10, minNoticeMinutes: 60, maxAdvanceDays: 60, defaultBookingDurationMinutes: 120, slotCapacity: 1, bookingInstructions: null, internalNotes: null, createdAt: "", updatedAt: "" },
    windows: [{ id: `w-${venueId}`, venueId, dayOfWeek: 6, startTime: "18:00", endTime: "19:00", isEnabled: true, createdAt: "", updatedAt: "" }],
    blackoutDates: [],
    bookedSlots,
  };
}
