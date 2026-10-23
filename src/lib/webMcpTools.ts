import { venueCategories } from "@/data/venueCategories";
import type { VenueDetails, VenueDetailsQuery } from "@/lib/venueDetails";
import { VenueSearchQueryError, type VenueSearchQuery, type VenueSearchResponse } from "@/lib/venueSearch";
import type { WebMcpModelContext, WebMcpTool } from "@/types/webMcp";
import type { VenuePrimaryCategory } from "@/types/venueCategories";

/**
 * Nokta's WebMCP tools: read-only venue search and venue details for AI agents
 * browsing the site. The data functions are passed in so this stays testable
 * and does not pull Supabase into the entry bundle.
 */

export const MAX_SEARCH_LIMIT = 50;

export interface WebMcpToolDeps {
  searchVenues: (query: VenueSearchQuery) => Promise<VenueSearchResponse>;
  getVenueDetails: (slug: string, query: VenueDetailsQuery) => Promise<VenueDetails | null>;
}

const VENUE_TYPES = venueCategories.map((category) => category.id);
const DATE = { type: "string", description: "Date in YYYY-MM-DD, UK time.", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } as const;
const PARTY_SIZE = { type: "integer", description: "Number of people. Venues set their own minimum and maximum.", minimum: 1, maximum: 50 } as const;

const BOOKING_NOTE =
  "Booking at Nokta is a request: the venue accepts, declines or suggests another time. Send the person to the venue's url to see free times and send a request; this tool cannot book.";

export function buildWebMcpTools(deps: WebMcpToolDeps): WebMcpTool[] {
  return [
    {
      name: "search_venues",
      description: `Find social venues on Nokta (shisha lounges today; restaurants, bars and cafés later) across UK cities. Filter by city, area, venue type, a free date and time, party size, and whether the venue has an offer. Featured venues come first and are marked featured (paid placement); offers are marked promoted (paid). Unclaimed listings have claimed: false. When nothing matches, noMatch says so and gives up to three close alternatives, each the same search with one filter loosened. ${BOOKING_NOTE}`,
      inputSchema: {
        type: "object",
        properties: {
          city: { type: "string", description: "UK city, for example London, Birmingham, Manchester." },
          area: { type: "string", description: "Neighbourhood or street within the city, for example Soho or Edgware Road. Partial names match." },
          type: { type: "string", description: "Venue type.", enum: VENUE_TYPES },
          date: { ...DATE, description: "Only venues that can take a booking request on this date (YYYY-MM-DD, UK time). Results include their free times." },
          time: { type: "string", description: "With date: only venues free at this time (HH:MM, 24-hour, UK time).", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
          partySize: PARTY_SIZE,
          hasOffer: { type: "boolean", description: "Only venues running an offer now." },
          limit: { type: "integer", description: `Most results to return (default 20, at most ${MAX_SEARCH_LIMIT}).`, minimum: 1, maximum: MAX_SEARCH_LIMIT },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => JSON.stringify(await deps.searchVenues(parseSearchArgs(args))),
    },
    {
      name: "get_venue_details",
      description: `Full details of one Nokta venue by its slug (from search_venues): description, address, prices, opening hours, menu, amenities, rating, links, current offers (marked promoted), whether it is featured, and free booking request times for a date or the next seven days. ${BOOKING_NOTE}`,
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "The venue's slug, as returned by search_venues." },
          date: { ...DATE, description: "Free times for this date only (YYYY-MM-DD, UK time). Without it, the next seven days." },
          partySize: PARTY_SIZE,
        },
        required: ["slug"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        const { slug, query } = parseDetailsArgs(args);
        const details = await deps.getVenueDetails(slug, query);
        return JSON.stringify(details ?? { found: false, message: `No venue with slug "${slug}". Use search_venues to find one.` });
      },
    },
  ];
}

/** Registers the tools; abort the returned controller to remove them. */
export function registerWebMcpTools(modelContext: WebMcpModelContext, deps: WebMcpToolDeps): AbortController {
  const controller = new AbortController();
  for (const tool of buildWebMcpTools(deps)) modelContext.registerTool(tool, { signal: controller.signal });
  return controller;
}

export function parseSearchArgs(args: Record<string, unknown>): VenueSearchQuery {
  rejectUnknown(args, ["city", "area", "type", "date", "time", "partySize", "hasOffer", "limit"]);
  const type = optionalString(args, "type");
  if (type !== undefined && !isVenueType(type)) throw new VenueSearchQueryError(`type must be one of: ${VENUE_TYPES.join(", ")}.`);
  const limit = optionalInteger(args, "limit");
  return {
    city: optionalString(args, "city"),
    area: optionalString(args, "area"),
    type,
    date: optionalString(args, "date"),
    time: optionalString(args, "time"),
    partySize: optionalInteger(args, "partySize"),
    hasOffer: optionalBoolean(args, "hasOffer"),
    limit: limit === undefined ? undefined : Math.min(limit, MAX_SEARCH_LIMIT),
  };
}

export function parseDetailsArgs(args: Record<string, unknown>): { slug: string; query: VenueDetailsQuery } {
  rejectUnknown(args, ["slug", "date", "partySize"]);
  const slug = optionalString(args, "slug");
  if (!slug) throw new VenueSearchQueryError("slug is required.");
  return { slug, query: { date: optionalString(args, "date"), partySize: optionalInteger(args, "partySize") } };
}

function isVenueType(value: string): value is VenuePrimaryCategory {
  return (VENUE_TYPES as string[]).includes(value);
}

function rejectUnknown(args: Record<string, unknown>, allowed: string[]) {
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new VenueSearchQueryError(`Unknown argument: ${unknown.join(", ")}.`);
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new VenueSearchQueryError(`${key} must be a string.`);
  return value.trim() || undefined;
}

function optionalInteger(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) throw new VenueSearchQueryError(`${key} must be a whole number.`);
  return value;
}

function optionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") throw new VenueSearchQueryError(`${key} must be true or false.`);
  return value;
}
