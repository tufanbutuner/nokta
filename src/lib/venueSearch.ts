import { checkBookingAvailability } from "@/lib/bookingAvailabilityValidation";
import { getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import { getSecondaryCategoryMatch } from "@/lib/filterVenues";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import type { VenueBookingAvailability, VenueBookingState } from "@/types/bookingAvailability";
import type { FeaturedPlacement } from "@/types/featuredPlacements";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";
import type { VenuePrimaryCategory } from "@/types/venueCategories";

/**
 * Venue search for AI assistants (WebMCP tools and the MCP server). Pure: the
 * caller loads venues, paid placements, offers and booking availability, and
 * this decides what matches and in what order.
 *
 * Ordering follows the city page: featured venues first in placement priority
 * order, clearly marked, then every other match by name.
 *
 * When nothing matches, the response says so and offers close alternatives:
 * the same search with one filter loosened, closest change first.
 */

export const DEFAULT_SEARCH_LIMIT = 20;
const SUMMARY_LENGTH = 220;
const MAX_ALTERNATIVES = 3;
const ALTERNATIVE_RESULTS = 3;
/** How many days after the searched date to look for free times. */
const LATER_DAYS = 6;

export interface VenueSearchQuery {
  city?: string;
  area?: string;
  type?: VenuePrimaryCategory;
  /** YYYY-MM-DD. With it, only venues that can take a booking request that day (or at `time`) match. */
  date?: string;
  /** HH:MM, 24-hour. Needs `date`. */
  time?: string;
  partySize?: number;
  hasOffer?: boolean;
  limit?: number;
}

export interface VenueSearchContext {
  /** Every venue a visitor can find: no test venues, nothing permanently closed. */
  venues: Venue[];
  /** Active featured placements, highest priority first. */
  placements: FeaturedPlacement[];
  /** Active promoted offers. */
  offers: PromotedOffer[];
  /** Needed only when the query has a date. */
  bookingStates?: ReadonlyMap<string, VenueBookingState>;
  availability?: ReadonlyMap<string, VenueBookingAvailability | null>;
  siteUrl: string;
  now?: Date;
}

export interface VenueSearchOffer {
  title: string;
  description: string | null;
  endsAt: string;
  promoted: true;
}

export interface VenueSearchResult {
  name: string;
  slug: string;
  type: string;
  city: string;
  area: string;
  summary: string;
  priceLevel: string;
  priceFrom: number | null;
  url: string;
  /** Paid featured placement. */
  featured: boolean;
  /** False for listings no owner has claimed yet; their details are not confirmed by the venue. */
  claimed: boolean;
  offers: VenueSearchOffer[];
  /** Free booking request times on the searched date, when a date was given. */
  freeTimes?: string[];
}

export interface VenueSearchAlternative {
  /** What was loosened, in plain English. */
  change: string;
  query: VenueSearchQuery;
  total: number;
  results: VenueSearchResult[];
}

export interface VenueSearchResponse {
  total: number;
  results: VenueSearchResult[];
  /** Only when nothing matched. */
  noMatch?: { message: string; alternatives: VenueSearchAlternative[] };
}

export class VenueSearchQueryError extends Error {}

export function validateVenueSearchQuery(query: VenueSearchQuery): void {
  if (query.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(query.date)) throw new VenueSearchQueryError("date must be YYYY-MM-DD.");
  if (query.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(query.time)) throw new VenueSearchQueryError("time must be HH:MM, 24-hour.");
  if (query.time !== undefined && query.date === undefined) throw new VenueSearchQueryError("time needs a date.");
  if (query.partySize !== undefined && (!Number.isInteger(query.partySize) || query.partySize < 1)) throw new VenueSearchQueryError("partySize must be a whole number of at least 1.");
  if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1)) throw new VenueSearchQueryError("limit must be a whole number of at least 1.");
}

export function searchVenues(context: VenueSearchContext, query: VenueSearchQuery): VenueSearchResponse {
  validateVenueSearchQuery(query);
  const search = createSearch(context);
  const matches = search.find(query);
  const limit = query.limit ?? DEFAULT_SEARCH_LIMIT;
  const response: VenueSearchResponse = { total: matches.length, results: matches.slice(0, limit).map(search.toResult) };
  if (matches.length > 0) return response;

  const alternatives: VenueSearchAlternative[] = [];
  for (const candidates of getAlternativeQueries(query)) {
    if (alternatives.length === MAX_ALTERNATIVES) break;
    const found = candidates.map((candidate) => ({ ...candidate, matches: search.find(candidate.query) })).find((candidate) => candidate.matches.length > 0);
    if (found) alternatives.push({ change: found.change, query: found.query, total: found.matches.length, results: found.matches.slice(0, ALTERNATIVE_RESULTS).map(search.toResult) });
  }

  return {
    ...response,
    noMatch: {
      message: alternatives.length ? "No venues matched this search. Here are close alternatives." : "No venues matched this search, and loosening one filter found nothing either. Try another city or fewer filters.",
      alternatives,
    },
  };
}

interface VenueMatch {
  venue: Venue;
  freeTimes: string[] | undefined;
}

function createSearch(context: VenueSearchContext) {
  const now = context.now ?? new Date();
  const offersByVenue = groupOffersByVenue(context.offers);
  const featuredRank = getFeaturedRank(context.placements);

  return {
    find: (query: VenueSearchQuery): VenueMatch[] =>
      context.venues
        .filter((venue) => matchesPlaceAndType(venue, query))
        .filter((venue) => !query.hasOffer || (offersByVenue.get(venue.id)?.length ?? 0) > 0)
        .map((venue) => ({ venue, freeTimes: query.date ? getFreeTimes(context, venue.id, query, now) : undefined }))
        .filter(({ freeTimes }) => freeTimes === undefined || freeTimes.length > 0)
        .sort((a, b) => compareFeatured(featuredRank, a.venue, b.venue) || a.venue.name.localeCompare(b.venue.name)),
    toResult: ({ venue, freeTimes }: VenueMatch) => toResult(venue, context.siteUrl, featuredRank.has(venue.id), offersByVenue.get(venue.id) ?? [], freeTimes),
  };
}

type AlternativeQuery = { change: string; query: VenueSearchQuery };

/**
 * The search with one filter loosened, closest to what was asked first. Each
 * group is one kind of change; only its first option that finds venues is used,
 * so six later days cannot crowd out a wider area.
 */
function getAlternativeQueries(query: VenueSearchQuery): AlternativeQuery[][] {
  const base: VenueSearchQuery = { ...query, limit: undefined };
  const { date } = base;
  const groups: AlternativeQuery[][] = [];
  if (date && base.time) groups.push([{ change: `Other free times on ${date}`, query: { ...base, time: undefined } }]);
  if (date) {
    groups.push(
      Array.from({ length: LATER_DAYS }, (_, index) => {
        const laterDate = addDays(date, index + 1);
        return { change: `Free on ${laterDate} instead`, query: { ...base, date: laterDate } };
      }),
    );
  }
  if (base.area) groups.push([{ change: base.city ? `Anywhere in ${base.city}` : "Any area", query: { ...base, area: undefined } }]);
  if (base.hasOffer) groups.push([{ change: "Without needing an offer", query: { ...base, hasOffer: undefined } }]);
  if (base.type) groups.push([{ change: "Any venue type", query: { ...base, type: undefined } }]);
  // Most listings cannot take booking requests yet; they can still be visited or contacted directly.
  if (date) groups.push([{ change: "Without a date: most of these do not take booking requests on Nokta yet, so check the venue page or contact the venue", query: { ...base, date: undefined, time: undefined, partySize: undefined } }]);
  if (base.city) groups.push([{ change: "Any city", query: { ...base, city: undefined, area: undefined } }]);
  return groups;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/**
 * Free booking request times for a venue on a date: only venues that are live
 * for booking requests have any. With a time, that single time if it is free.
 */
export function getFreeTimes(context: Pick<VenueSearchContext, "bookingStates" | "availability">, venueId: string, query: Pick<VenueSearchQuery, "date" | "time" | "partySize">, now: Date): string[] {
  if (!query.date) return [];
  if (context.bookingStates?.get(venueId) !== "live") return [];
  const availability = context.availability?.get(venueId);
  if (!availability) return [];

  const partySize = query.partySize ?? Math.max(2, availability.settings.minPartySize);
  if (query.time) {
    const check = checkBookingAvailability({ availability, requestedDate: query.date, requestedTime: query.time, partySize, now });
    return check.isAvailable ? [query.time] : [];
  }

  if (partySize < availability.settings.minPartySize || partySize > availability.settings.maxPartySize) return [];
  return getBookingTimeOptions({ availability, selectedDate: query.date, now });
}

function matchesPlaceAndType(venue: Venue, query: Pick<VenueSearchQuery, "city" | "area" | "type">) {
  return matchesPlace(venue, query) && matchesType(venue, query.type);
}

function matchesPlace(venue: Venue, query: Pick<VenueSearchQuery, "city" | "area">) {
  const city = normalise(query.city);
  const area = normalise(query.area);
  if (city && normalise(venue.city) !== city) return false;
  // Areas are free text ("Soho", "Edgware Road"), so a partial match is more useful than an exact one.
  if (area && !normalise(venue.area).includes(area) && !normalise(venue.address).includes(area)) return false;
  return true;
}

function matchesType(venue: Venue, type: VenuePrimaryCategory | undefined) {
  if (!type) return true;
  return venue.primaryCategory === type || venue.secondaryCategories.includes(getSecondaryCategoryMatch(type));
}

function getFeaturedRank(placements: FeaturedPlacement[]) {
  const rank = new Map<string, number>();
  placements.forEach((placement, index) => {
    if (!rank.has(placement.venueId)) rank.set(placement.venueId, index);
  });
  return rank;
}

function compareFeatured(rank: Map<string, number>, a: Venue, b: Venue) {
  const rankA = rank.get(a.id) ?? Number.POSITIVE_INFINITY;
  const rankB = rank.get(b.id) ?? Number.POSITIVE_INFINITY;
  if (rankA === rankB) return 0;
  return rankA < rankB ? -1 : 1;
}

function groupOffersByVenue(offers: PromotedOffer[]) {
  const byVenue = new Map<string, PromotedOffer[]>();
  for (const offer of offers) {
    byVenue.set(offer.venueId, [...(byVenue.get(offer.venueId) ?? []), offer]);
  }
  return byVenue;
}

function toResult(venue: Venue, siteUrl: string, featured: boolean, offers: PromotedOffer[], freeTimes: string[] | undefined): VenueSearchResult {
  return {
    name: venue.name,
    slug: venue.slug,
    type: formatVenuePrimaryCategory(venue.primaryCategory),
    city: venue.city,
    area: venue.area,
    summary: summarise(venue.description),
    priceLevel: "£".repeat(venue.priceLevel),
    priceFrom: venue.priceFrom ?? null,
    url: `${siteUrl}/venues/${venue.slug}`,
    featured,
    claimed: venue.isClaimed,
    offers: offers.map((offer) => ({ title: offer.title, description: offer.description, endsAt: offer.endsAt, promoted: true })),
    ...(freeTimes ? { freeTimes } : {}),
  };
}

function summarise(description: string) {
  const text = description.replace(/\s+/g, " ").trim();
  if (text.length <= SUMMARY_LENGTH) return text;
  const cut = text.slice(0, SUMMARY_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : SUMMARY_LENGTH)}…`;
}

function normalise(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}
