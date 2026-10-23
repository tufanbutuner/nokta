import { getVenueCurrentStatus, type VenueCurrentStatus } from "@/lib/openingHours";
import { getVenueAmenities } from "@/lib/venueAmenities";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import { formatVibe } from "@/lib/venueFilters";
import { formatPenceAsPrice } from "@/lib/venueMenuValidation";
import { getFreeTimes, validateVenueSearchQuery, type VenueSearchOffer } from "@/lib/venueSearch";
import type { VenueBookingAvailability, VenueBookingState } from "@/types/bookingAvailability";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { VenueRatingSummary } from "@/types/reviews";
import type { OpeningHours, Venue } from "@/types/venue";
import type { VenueMenu } from "@/types/venueMenu";

/**
 * One venue's details for AI assistants: what a visitor sees on its venue page,
 * plus free booking request times and current offers. Pure; the service loads
 * the data. Owner, monetisation and internal fields are never included.
 */

/** Days of free times returned when no date is asked for. */
export const DEFAULT_FREE_TIME_DAYS = 7;

export interface VenueDetailsQuery {
  /** YYYY-MM-DD. Without it, the next seven days are returned. */
  date?: string;
  partySize?: number;
}

export interface VenueDetailsInput {
  venue: Venue;
  siteUrl: string;
  featured: boolean;
  offers: PromotedOffer[];
  menu: VenueMenu | null;
  rating: VenueRatingSummary | null;
  bookingState: VenueBookingState | null;
  availability: VenueBookingAvailability | null;
  query: VenueDetailsQuery;
  now?: Date;
}

export interface VenueDetails {
  name: string;
  slug: string;
  url: string;
  type: string;
  city: string;
  area: string;
  address: string;
  postcode: string;
  description: string;
  priceLevel: string;
  priceFrom: number | null;
  rating: { average: number; reviewCount: number } | null;
  openNow: VenueCurrentStatus;
  openingHours: OpeningHours[];
  amenities: string[];
  vibes: string[];
  menu: { section: string; items: { name: string; note: string | null; price: string }[] }[];
  menuUrl: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  /** Paid featured placement. */
  featured: boolean;
  /** False for listings no owner has claimed yet; their details are not confirmed by the venue. */
  claimed: boolean;
  lastVerifiedAt: string | null;
  offers: VenueSearchOffer[];
  bookingRequests: {
    /** Booking is a request the venue accepts, declines or counters; never instant confirmation. */
    acceptsRequests: boolean;
    freeTimes: { date: string; times: string[] }[];
  };
}

export function buildVenueDetails(input: VenueDetailsInput): VenueDetails {
  validateVenueSearchQuery({ date: input.query.date, partySize: input.query.partySize });
  const { venue } = input;
  const now = input.now ?? new Date();
  const acceptsRequests = input.bookingState === "live";
  const context = { bookingStates: new Map(input.bookingState ? [[venue.id, input.bookingState]] : []), availability: new Map([[venue.id, input.availability]]) };
  const dates = input.query.date ? [input.query.date] : getNextLondonDates(now, DEFAULT_FREE_TIME_DAYS);

  return {
    name: venue.name,
    slug: venue.slug,
    url: `${input.siteUrl}/venues/${venue.slug}`,
    type: formatVenuePrimaryCategory(venue.primaryCategory),
    city: venue.city,
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    description: venue.description,
    priceLevel: "£".repeat(venue.priceLevel),
    priceFrom: venue.priceFrom ?? null,
    // Same rule as the venue page header: published reviews first, then the listing's rating.
    rating: getRating(venue, input.rating),
    openNow: getVenueCurrentStatus(venue, now),
    openingHours: venue.openingHours,
    amenities: getVenueAmenities(venue).filter((amenity) => !amenity.isUnknown).map((amenity) => amenity.label),
    vibes: venue.vibes.map(formatVibe),
    menu: formatMenu(input.menu),
    menuUrl: venue.dataSources.shishaMenuUrl ?? venue.dataSources.menuUrl ?? null,
    website: venue.website ?? null,
    instagram: venue.instagram ?? null,
    phone: venue.phone ?? null,
    featured: input.featured,
    claimed: venue.isClaimed,
    lastVerifiedAt: venue.lastVerifiedAt ?? null,
    offers: input.offers.map((offer) => ({ title: offer.title, description: offer.description, endsAt: offer.endsAt, promoted: true })),
    bookingRequests: {
      acceptsRequests,
      freeTimes: acceptsRequests
        ? dates.map((date) => ({ date, times: getFreeTimes(context, venue.id, { date, partySize: input.query.partySize }, now) })).filter((day) => day.times.length > 0)
        : [],
    },
  };
}

/** Today and the following days as YYYY-MM-DD in UK time, whatever the server's time zone. */
export function getNextLondonDates(now: Date, days: number): string[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [year, month, day] = today.split("-").map(Number);
  // Step calendar days, not 24-hour blocks: a day with a clock change is 23 or 25 hours long.
  return Array.from({ length: days }, (_, index) => new Date(Date.UTC(year, month - 1, day + index)).toISOString().slice(0, 10));
}

function getRating(venue: Venue, summary: VenueRatingSummary | null) {
  if (summary?.averageRating != null && summary.reviewCount > 0) return { average: Math.round(summary.averageRating * 10) / 10, reviewCount: summary.reviewCount };
  if (venue.rating != null) return { average: venue.rating, reviewCount: 0 };
  return null;
}

function formatMenu(menu: VenueMenu | null): VenueDetails["menu"] {
  if (!menu) return [];
  return menu.sections
    .map((section) => ({
      section: section.name,
      items: menu.items.filter((item) => item.sectionId === section.id && item.isLive).map((item) => ({ name: item.name, note: item.note, price: formatPenceAsPrice(item.pricePence) })),
    }))
    .filter((section) => section.items.length > 0);
}
