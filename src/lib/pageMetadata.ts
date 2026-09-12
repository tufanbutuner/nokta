import { brandConfig } from "@/config/brand";

export interface PageMetadata {
  title: string;
  description: string;
  /** Absolute or root-relative; resolved against the site URL before use. */
  image?: string;
}

export const DEFAULT_OG_IMAGE = "/og-image.png";

export const SITE_FALLBACK_METADATA: PageMetadata = {
  title: `${brandConfig.appName} - Discover Social Venues Across the UK`,
  description: brandConfig.longDescription,
  image: DEFAULT_OG_IMAGE,
};

/**
 * Metadata for routes whose copy is fixed.
 *
 * This is the single source for both renderers: the React `PageMeta` component
 * reads it at runtime, and the edge middleware reads it when answering a social
 * crawler. Keeping one table is the point — duplicating these strings in the
 * middleware would let the two drift apart silently, and the drift would only
 * ever be visible in a shared link, which nobody checks.
 *
 * Data-driven routes (a venue, a city) are not here; the middleware builds their
 * metadata from the record it fetches. Routes disallowed in robots.txt (sign-in,
 * account, owner, admin) are omitted too: they are never crawled or shared.
 *
 * The edge runtime cannot resolve the "@/" alias, so `middleware.ts` restates this
 * table. Edit both together; `npm run check:metadata` fails the build if they drift.
 */
export const STATIC_PAGE_METADATA: Record<string, PageMetadata> = {
  "/": SITE_FALLBACK_METADATA,
  "/discover": {
    title: `Discover Venues Near You | ${brandConfig.appName}`,
    description: "Explore social venues by city, area and vibe. View photos, venue details, opening info and request bookings.",
  },
  "/for-venues": {
    title: `For Venues | ${brandConfig.appName}`,
    description: "Claim your Nokta profile, receive booking requests and manage customer demand from one simple dashboard.",
  },
  "/recommend": {
    title: "Find your spot in four questions | nokta",
    description: "Answer four questions and get three named picks — the safe bet, the wildcard and the closest.",
  },
  "/suggest": {
    title: "Suggest a nokta Venue | nokta",
    description: "Know a shisha spot we are missing? Suggest it for review.",
  },
  "/privacy": {
    title: "Privacy | nokta",
    description: "How nokta handles account data, saved venues, reviews, suggestions, location context and analytics events.",
  },
  "/terms": {
    title: "Terms | nokta",
    description: "Basic terms for using nokta venue discovery, user reviews and suggested venue data.",
  },
};

export function getStaticPageMetadata(pathname: string): PageMetadata | null {
  const normalised = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return STATIC_PAGE_METADATA[normalised] ?? null;
}
