import { next } from "@vercel/edge";

/**
 * Social crawlers do not run JavaScript.
 *
 * The app is a Vite SPA, so index.html ships with a placeholder `<title>nokta</title>`
 * and no og: tags at all — every meta tag is written by react-helmet after the
 * bundle executes. WhatsApp, Slack, iMessage, LinkedIn and Facebook fetch the raw
 * HTML and never see any of it, which is why a shared link renders a bare card.
 *
 * This middleware answers those crawlers with the same HTML plus the right tags
 * injected into the head. Real users are passed straight through untouched, so
 * the SPA renders exactly as before and pays no cost for this.
 *
 * Googlebot does render JavaScript and would eventually pick up the client tags,
 * but serving them directly is faster, more reliable, and is what every non-Google
 * crawler needs anyway.
 */

export const config = {
  // Skip assets outright: matching them would burn invocations on every file.
  // Skip /api too: those are server routes, not pages a crawler should ever see.
  matcher: ["/((?!api/|assets/|_next/|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|xml|txt|json)$).*)"],
};

const CRAWLER_PATTERN = /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|linkedinbot|telegrambot|discordbot|pinterest|redditbot|skypeuripreview|googlebot|bingbot|duckduckbot|applebot|yandex|baiduspider|embedly|quora link preview|vkshare|w3c_validator|ia_archiver|bitlybot|nuzzel|outbrain|developers\.google\.com\/\+\/web\/snippet|gptbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|anthropic-ai/i;

const SITE_URL = resolveSiteUrl();

function resolveSiteUrl(): string {
  const configured =
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    process.env.VERCEL_URL;
  if (!configured) return "https://www.nokta.uk";
  const withProtocol = configured.startsWith("http")
    ? configured
    : `https://${configured}`;
  return withProtocol.replace(/\/+$/, "");
}
const DEFAULT_OG_IMAGE = "/og-image.png";
const BRAND = "Nokta";

interface PageMetadata {
  title: string;
  description: string;
  image?: string;
  /** Serialised schema.org JSON-LD for this page, if it has any. */
  jsonLd?: string;
  /** Server-rendered HTML for the app root, so the crawler has content to index. */
  body?: string;
}

/**
 * A venue lookup has three outcomes, and they must not be collapsed:
 * "found" serves the venue, "missing" is a real 404, and "unavailable" (network
 * error, bad credentials, timeout) falls back to a 200 with site defaults. Treating
 * an outage as "missing" would 404 a live venue and have Google drop it from the
 * index over a blip.
 */
type VenueLookup =
  | { status: "found"; metadata: PageMetadata }
  | { status: "missing" }
  | { status: "unavailable" };

const SITE_FALLBACK: PageMetadata = {
  title: `${BRAND} - Discover Social Venues Across the UK`,
  description: "Find lounges, restaurants, bars and cafes across the UK, starting with shisha lounges.",
};

/**
 * Mirrors STATIC_PAGE_METADATA in src/lib/pageMetadata.ts. The edge runtime cannot
 * resolve the app's "@/" alias, so the table is restated here.
 * `npm run check:metadata` compares the two and fails if they drift.
 */
const STATIC_PAGES: Record<string, PageMetadata> = {
  "/": SITE_FALLBACK,
  "/discover": {
    title: `Discover Venues Near You | ${BRAND}`,
    description: "Explore social venues by city, area and vibe. View photos, venue details, opening info and request bookings.",
  },
  "/for-venues": {
    title: `For Venues | ${BRAND}`,
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

/**
 * Mirrors SUPPORTED_CITIES in src/data/supportedCities.ts, reduced to the fields
 * the crawler response needs. Restated here for the same reason as the metadata
 * table: the edge runtime cannot resolve the app's "@/" alias.
 * `npm run check:metadata` compares the two and fails if they drift.
 */
const CITIES: { name: string; slug: string; isActive: boolean }[] = [
  { name: "London", slug: "london", isActive: true },
  { name: "Birmingham", slug: "birmingham", isActive: true },
  { name: "Manchester", slug: "manchester", isActive: true },
  { name: "Leicester", slug: "leicester", isActive: true },
  { name: "Bradford", slug: "bradford", isActive: false },
  { name: "Leeds", slug: "leeds", isActive: false },
  { name: "Liverpool", slug: "liverpool", isActive: false },
  { name: "Sheffield", slug: "sheffield", isActive: false },
  { name: "Nottingham", slug: "nottingham", isActive: false },
  { name: "Glasgow", slug: "glasgow", isActive: false },
];

/** Mirrors getCityPageMetadata in src/lib/pageMetadata.ts. */
function cityMetadata(cityName: string): PageMetadata {
  return {
    title: `Venues in ${cityName} | nokta`,
    description: `Explore social venues in ${cityName}, including lounges, late-night spots and shisha lounges. View venue details, photos and request bookings.`,
  };
}

/** Mirrors getInactiveCityPageMetadata in src/lib/pageMetadata.ts. */
function inactiveCityMetadata(cityName: string): PageMetadata {
  return {
    title: `${cityName} coming soon | nokta`,
    description: `We are adding verified social venues in ${cityName} soon.`,
  };
}

/** Mirrors getVenuePageMetadata in src/lib/pageMetadata.ts. */
function venueMetadata(venue: { name: string; city: string; area: string; description?: string | null }): PageMetadata {
  return {
    title: `${venue.name} in ${venue.city} | nokta`,
    description: venue.description?.trim() || `View opening hours, photos, features and booking details for ${venue.name} in ${venue.area}, ${venue.city}.`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface VenueRow {
  name: string;
  slug: string;
  city: string;
  area: string;
  address: string | null;
  postcode: string | null;
  country: string | null;
  description: string | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  price_level: number | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  business_status: string | null;
  opening_hours: { day: string; open: string; close: string }[] | null;
  halal: boolean | null;
  outdoor: boolean | null;
  indoor: boolean | null;
  food: boolean | null;
  alcohol: boolean | null;
  open_late: boolean | null;
}

const VENUE_COLUMNS =
  "name,slug,city,area,address,postcode,country,description,images,latitude,longitude,price_level,phone,website,instagram,business_status,opening_hours,halal,outdoor,indoor,food,alcohol,open_late";

const SCHEMA_DAYS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * `</script>` anywhere inside the JSON would close the tag early and let the rest
 * of the value be parsed as markup, so `<` is escaped. JSON.stringify handles the
 * quoting; this covers the one case it does not.
 */
function serialiseJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Unrecognised or half-filled day entries are dropped rather than guessed at. */
function buildOpeningHoursSpecification(hours: VenueRow["opening_hours"]) {
  if (!hours?.length) return undefined;

  const specs = hours
    .map((entry) => {
      const day = SCHEMA_DAYS[entry.day?.trim().toLowerCase() ?? ""];
      if (!day || !entry.open?.trim() || !entry.close?.trim()) return null;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${day}`,
        opens: entry.open.trim(),
        closes: entry.close.trim(),
      };
    })
    .filter((spec): spec is NonNullable<typeof spec> => spec !== null);

  return specs.length ? specs : undefined;
}

/**
 * A `Restaurant` node for the venue. Only fields the record actually has are
 * emitted: Google treats empty or placeholder values as a quality problem, and a
 * partial-but-true node is worth more than a complete-looking invented one.
 *
 * `aggregateRating` is deliberately absent. The rating column is a bare number with
 * no review count behind it, and Google requires the count — publishing one without
 * it, or with a fabricated count, is a structured-data violation.
 */
/**
 * schema.org expects an ISO 3166-1 alpha-2 code, but the venues table stores a
 * display name ("United Kingdom"). Anything unrecognised is passed through rather
 * than forced to GB — a wrong code is worse than an unmapped name.
 */
const COUNTRY_CODES: Record<string, string> = {
  "united kingdom": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  uk: "GB",
  gb: "GB",
};

function countryCode(country: string | null): string {
  const value = country?.trim();
  if (!value) return "GB";
  return COUNTRY_CODES[value.toLowerCase()] ?? value;
}

function buildVenueJsonLd(venue: VenueRow, url: string): string {
  const images = (venue.images ?? []).filter(Boolean).map(absoluteUrl);
  const sameAs = [venue.website, venue.instagram].map((value) => value?.trim()).filter((value): value is string => Boolean(value));

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": url,
    name: venue.name,
    url,
  };

  if (venue.description?.trim()) node.description = venue.description.trim();
  if (images.length) node.image = images;
  if (venue.phone?.trim()) node.telephone = venue.phone.trim();
  if (sameAs.length) node.sameAs = sameAs;
  if (venue.price_level) node.priceRange = "£".repeat(Math.min(Math.max(venue.price_level, 1), 4));

  if (venue.address?.trim() || venue.postcode?.trim()) {
    node.address = {
      "@type": "PostalAddress",
      ...(venue.address?.trim() ? { streetAddress: venue.address.trim() } : {}),
      addressLocality: venue.city,
      ...(venue.area?.trim() ? { addressRegion: venue.area.trim() } : {}),
      ...(venue.postcode?.trim() ? { postalCode: venue.postcode.trim() } : {}),
      addressCountry: countryCode(venue.country),
    };
  }

  if (typeof venue.latitude === "number" && typeof venue.longitude === "number") {
    node.geo = { "@type": "GeoCoordinates", latitude: venue.latitude, longitude: venue.longitude };
  }

  const openingHours = buildOpeningHoursSpecification(venue.opening_hours);
  if (openingHours) node.openingHoursSpecification = openingHours;

  return serialiseJsonLd(node);
}

/** The venues shown on a city page, for the crawler's listing and internal links. */
interface CityVenueRow {
  name: string;
  slug: string;
  area: string;
}

/**
 * Venues in a city, for the city page's listing.
 *
 * Test venues are excluded to match `useVenues`, which hides them from everyone
 * but admins — a crawler is the most public viewer there is. Permanently closed
 * venues are excluded too: linking crawlers to a venue that no longer exists
 * wastes crawl budget and puts a dead page in the index.
 *
 * Returns null on any failure. The city page still renders without its listing,
 * which is worth more than failing the request.
 */
async function getCityVenues(cityName: string): Promise<CityVenueRow[] | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const query = `${supabaseUrl}/rest/v1/venues?city=eq.${encodeURIComponent(cityName)}&is_test=is.false&business_status=neq.permanently-closed&select=name,slug,area&order=name.asc&limit=100`;
    const response = await fetch(query, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;

    return (await response.json()) as CityVenueRow[];
  } catch {
    return null;
  }
}

/** A venue's own metadata, read straight from the public venues table. */
async function getVenueMetadata(slug: string, url: string): Promise<VenueLookup> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return { status: "unavailable" };

  try {
    const query = `${supabaseUrl}/rest/v1/venues?slug=eq.${encodeURIComponent(slug)}&select=${VENUE_COLUMNS}&limit=1`;
    const response = await fetch(query, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return { status: "unavailable" };

    const rows = (await response.json()) as VenueRow[];
    const venue = rows[0];
    // An empty result from a healthy query is the only outcome that genuinely means
    // "no such venue" — every failure above is an outage and must not become a 404.
    if (!venue) return { status: "missing" };
    // A permanently-closed venue is deliberately hidden from the app, so the crawler
    // must not keep the URL indexed either — treat it as gone rather than serving a
    // page users can no longer reach. It stays in the database for reference.
    if (venue.business_status === "permanently-closed") return { status: "missing" };

    return {
      status: "found",
      metadata: {
        ...venueMetadata(venue),
        image: venue.images?.[0],
        jsonLd: buildVenueJsonLd(venue, url),
        body: buildVenueBody(venue),
      },
    };
  } catch {
    // A slow or failing lookup must never block the page: fall back to site defaults.
    return { status: "unavailable" };
  }
}

interface ResolvedPage {
  metadata: PageMetadata;
  /**
   * True only for a venue slug the database confirmed does not exist. The response
   * is then served with a 404 so Google drops the URL instead of indexing a shell
   * page carrying generic site copy — a soft 404.
   */
  notFound: boolean;
}

/**
 * A city page is a listing, so it is a `CollectionPage` rather than a place. The
 * breadcrumb is what earns the trail in search results.
 *
 * The `ItemList` is emitted only when the venue list was actually fetched, and it
 * lists exactly what the page body shows. A list that disagrees with the visible
 * content is a structured-data violation, so a failed lookup emits none.
 */
function buildCityJsonLd(metadata: PageMetadata, cityName: string, url: string, venues: CityVenueRow[] | null): string {
  return serialiseJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: metadata.title,
    description: metadata.description,
    url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(venues?.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: venues.length,
            itemListElement: venues.map((venue, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: venue.name,
              url: `${SITE_URL}/venues/${venue.slug}`,
            })),
          },
        }
      : {}),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Discover", item: `${SITE_URL}/discover` },
        { "@type": "ListItem", position: 3, name: cityName, item: url },
      ],
    },
  });
}

/** Site-wide identity, attached to the pages whose content is fixed. */
function buildSiteJsonLd(): string {
  return serialiseJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND,
    url: SITE_URL,
    description: SITE_FALLBACK.description,
  });
}

async function getMetadata(pathname: string, url: string): Promise<ResolvedPage> {
  const normalised = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const staticPage = STATIC_PAGES[normalised];
  if (staticPage) return { metadata: { ...staticPage, jsonLd: buildSiteJsonLd() }, notFound: false };

  const cityMatch = normalised.match(/^\/cities\/([^/]+)$/);
  if (cityMatch) {
    // Slugs are matched exactly, because the app's getCityBySlug does. Accepting
    // "/cities/LONDON" here while React renders "City not found" would serve the
    // crawler a different page than the user gets.
    const city = CITIES.find((entry) => entry.slug === cityMatch[1]);
    // The city list is static, so an unknown slug is definitively a 404 — there is
    // no lookup here that could fail and no outage case to protect against.
    if (!city) return { metadata: { title: "City not found | nokta", description: "This nokta city page is not available." }, notFound: true };

    // A roadmap city still gets an indexable page: it ranks for the city name and
    // routes that demand into the suggest flow. It has no venues by definition, so
    // it is not worth a query.
    const metadata = city.isActive ? cityMetadata(city.name) : inactiveCityMetadata(city.name);
    const venues = city.isActive ? await getCityVenues(city.name) : null;

    return {
      metadata: {
        ...metadata,
        jsonLd: buildCityJsonLd(metadata, city.name, url, venues),
        body: buildCityBody(city.name, metadata, venues),
      },
      notFound: false,
    };
  }

  const venueMatch = normalised.match(/^\/venues\/([^/]+)$/);
  if (venueMatch) {
    const lookup = await getVenueMetadata(venueMatch[1], url);
    if (lookup.status === "found") return { metadata: lookup.metadata, notFound: false };
    // An outage keeps the old behaviour: site defaults, still a 200.
    return { metadata: SITE_FALLBACK, notFound: lookup.status === "missing" };
  }

  return { metadata: SITE_FALLBACK, notFound: false };
}

/**
 * Server-rendered body content for a crawler.
 *
 * Without this the crawler receives `<div id="root"></div>` and has nothing to
 * index: every word on a venue page is written by React after the bundle runs.
 * Googlebot renders JavaScript eventually, but most other crawlers do not, and
 * even Google indexes server HTML sooner and more reliably.
 *
 * This is deliberately NOT a reimplementation of the React tree. It carries the
 * same facts — name, description, address, hours, features — in plain semantic
 * markup. Crawler and user HTML already differ (no map, tabs, reviews or booking
 * controls here), and the standard to meet is that the content not be misleading,
 * not that the DOM match. Chasing DOM equality would mean duplicating the app's
 * layout components in the edge, which would drift silently and buy nothing.
 *
 * The markup is replaced by React on hydration, so it is never seen by a user.
 */
function buildVenueBody(venue: VenueRow): string {
  const parts: string[] = [];

  parts.push(`<nav aria-label="Breadcrumb"><a href="/discover">Discover</a> / <a href="/cities/${escapeHtml(createCitySlug(venue.city))}">${escapeHtml(venue.city)}</a> / <span>${escapeHtml(venue.name)}</span></nav>`);
  parts.push(`<h1>${escapeHtml(venue.name)}</h1>`);
  parts.push(`<p>${escapeHtml([venue.area, venue.city].filter(Boolean).join(", "))}</p>`);

  if (venue.description?.trim()) parts.push(`<p>${escapeHtml(venue.description.trim())}</p>`);

  const images = (venue.images ?? []).filter(Boolean).slice(0, 3);
  // Alt text names the venue rather than describing the photo: the caption is not
  // in the data, and a generic "venue photo" helps nobody using a screen reader.
  if (images.length) parts.push(images.map((image, index) => `<img src="${escapeHtml(absoluteUrl(image))}" alt="${escapeHtml(venue.name)} in ${escapeHtml(venue.city)}${index ? ` (photo ${index + 1})` : ""}" width="800" height="600" loading="lazy">`).join("\n      "));

  // The address column usually already ends with the city, so appending it again
  // would read "178a Wandsworth Rd, London, London, SW8 2LA". Only the parts the
  // street line does not already carry are added.
  const street = venue.address?.trim();
  const postcode = venue.postcode?.trim();
  if (street) {
    const hasCity = street.toLowerCase().includes(venue.city.toLowerCase());
    const addressLine = [street, hasCity ? null : venue.city, postcode].filter(Boolean).map((part) => escapeHtml(part as string)).join(", ");
    parts.push(`<h2>Address</h2>\n      <address>${addressLine}</address>`);
  }
  if (venue.phone?.trim()) parts.push(`<p>Phone: <a href="tel:${escapeHtml(venue.phone.replace(/\s+/g, ""))}">${escapeHtml(venue.phone.trim())}</a></p>`);

  const hours = (venue.opening_hours ?? []).filter((entry) => SCHEMA_DAYS[entry.day?.trim().toLowerCase() ?? ""] && entry.open?.trim() && entry.close?.trim());
  if (hours.length) {
    const rows = hours.map((entry) => `<tr><th scope="row">${escapeHtml(SCHEMA_DAYS[entry.day.trim().toLowerCase()])}</th><td>${escapeHtml(entry.open.trim())}–${escapeHtml(entry.close.trim())}</td></tr>`).join("\n        ");
    parts.push(`<h2>Opening hours</h2>\n      <table>\n        ${rows}\n      </table>`);
  }

  const features = [
    venue.halal ? "Halal" : null,
    venue.food ? "Food" : null,
    venue.alcohol ? "Alcohol" : null,
    venue.outdoor ? "Outdoor seating" : null,
    venue.indoor ? "Indoor seating" : null,
    venue.open_late ? "Open late" : null,
  ].filter((feature): feature is string => feature !== null);
  if (features.length) parts.push(`<h2>Features</h2>\n      <ul>${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>`);

  if (venue.website?.trim()) parts.push(`<p><a href="${escapeHtml(venue.website.trim())}" rel="nofollow noopener">Visit website</a></p>`);

  // An internal link back to the city keeps crawlers moving through the catalogue
  // rather than treating each venue as a dead end.
  parts.push(`<p><a href="/cities/${escapeHtml(createCitySlug(venue.city))}">More venues in ${escapeHtml(venue.city)}</a></p>`);

  return parts.join("\n      ");
}

/**
 * Server-rendered body for a city page. The venue list is the point: it gives
 * crawlers a path from the city page to every venue in that city, which is how
 * the venue pages get discovered and recrawled.
 */
function buildCityBody(cityName: string, metadata: PageMetadata, venues: CityVenueRow[] | null): string {
  const parts: string[] = [];

  parts.push(`<nav aria-label="Breadcrumb"><a href="/discover">Discover</a> / <span>${escapeHtml(cityName)}</span></nav>`);
  parts.push(`<h1>Venues in ${escapeHtml(cityName)}</h1>`);
  parts.push(`<p>${escapeHtml(metadata.description)}</p>`);

  if (venues?.length) {
    // Name and area only. Each venue's description belongs on its own page, and
    // repeating all of them here would duplicate that content onto the city page
    // while adding tens of kilobytes to every crawl.
    const items = venues
      .map((venue) => {
        const area = venue.area?.trim();
        return `<li><a href="/venues/${escapeHtml(venue.slug)}">${escapeHtml(venue.name)}</a>${area ? ` — ${escapeHtml(area)}` : ""}</li>`;
      })
      .join("\n        ");
    parts.push(`<h2>${venues.length === 1 ? "1 venue" : `${venues.length} venues`} in ${escapeHtml(cityName)}</h2>\n      <ul>\n        ${items}\n      </ul>`);
  }

  parts.push(`<p><a href="/discover?city=${encodeURIComponent(cityName)}">Open Discover</a></p>`);

  return parts.join("\n      ");
}

/** Mirrors createCitySlug in src/lib/cities.ts. */
function createCitySlug(cityName: string): string {
  return cityName
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTags(metadata: PageMetadata, url: string, notFound: boolean): string {
  const usesDefaultImage = !metadata.image;
  const image = absoluteUrl(metadata.image ?? DEFAULT_OG_IMAGE);
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    // A page served as 404 must not nominate itself as canonical, and should ask
    // not to be indexed at all.
    notFound ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    // The dimensions are only true of the site's own 1200x630 card. Venue photos
    // are arbitrary sizes, and declaring the wrong ones makes some clients crop or
    // skip the image outright.
    ...(usesDefaultImage ? [`<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`] : []),
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    ...(metadata.jsonLd ? [`<script type="application/ld+json">${metadata.jsonLd}</script>`] : []),
  ];

  return tags.join("\n    ");
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!CRAWLER_PATTERN.test(userAgent)) return next();

  const url = new URL(request.url);
  const response = await fetch(new URL("/index.html", url.origin), { headers: { "user-agent": "nokta-middleware" } });
  if (!response.ok) return next();

  const html = await response.text();
  const canonical = `${SITE_URL}${url.pathname}`;
  const { metadata, notFound } = await getMetadata(url.pathname, canonical);

  // Replace the placeholder title rather than leaving two in the document.
  const withTags = html.replace(/<title>.*?<\/title>/i, "").replace("</head>", `  ${buildTags(metadata, canonical, notFound)}\n  </head>`);

  // React replaces the root's contents on hydration, so this is only ever seen by
  // a crawler. If the root div is not found the page still serves — with an empty
  // body, exactly as before — rather than failing the request.
  const withBody = metadata.body ? withTags.replace('<div id="root"></div>', `<div id="root">\n      ${metadata.body}\n    </div>`) : withTags;

  return new Response(withBody, {
    status: notFound ? 404 : 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Crawlers re-fetch on every share; caching keeps the Supabase lookup rare.
      // A 404 is cached far more briefly: a venue added right after a crawl should
      // start returning 200 quickly rather than sitting on a stale miss.
      "cache-control": notFound ? "public, max-age=0, s-maxage=60" : "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "x-nokta-prerender": "crawler",
    },
  });
}
