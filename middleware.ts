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
  matcher: ["/((?!assets/|_next/|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|xml|txt|json)$).*)"],
};

const CRAWLER_PATTERN = /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|linkedinbot|telegrambot|discordbot|pinterest|redditbot|skypeuripreview|googlebot|bingbot|duckduckbot|applebot|yandex|baiduspider|embedly|quora link preview|vkshare|w3c_validator|ia_archiver|bitlybot|nuzzel|outbrain|developers\.google\.com\/\+\/web\/snippet|gptbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|anthropic-ai/i;

const SITE_URL = "https://www.nokta.uk";
const DEFAULT_OG_IMAGE = "/og-image.png";
const BRAND = "Nokta";

interface PageMetadata {
  title: string;
  description: string;
  image?: string;
  /** Serialised schema.org JSON-LD for this page, if it has any. */
  jsonLd?: string;
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
}

const VENUE_COLUMNS =
  "name,slug,city,area,address,postcode,country,description,images,latitude,longitude,price_level,phone,website,instagram,business_status,opening_hours";

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
      addressCountry: venue.country?.trim() || "GB",
    };
  }

  if (typeof venue.latitude === "number" && typeof venue.longitude === "number") {
    node.geo = { "@type": "GeoCoordinates", latitude: venue.latitude, longitude: venue.longitude };
  }

  const openingHours = buildOpeningHoursSpecification(venue.opening_hours);
  if (openingHours) node.openingHoursSpecification = openingHours;

  return serialiseJsonLd(node);
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

    return {
      status: "found",
      metadata: {
        title: `${venue.name} in ${venue.city} | nokta`,
        description: venue.description?.trim() || `View opening hours, photos, features and booking details for ${venue.name} in ${venue.area}, ${venue.city}.`,
        image: venue.images?.[0],
        jsonLd: buildVenueJsonLd(venue, url),
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
 * No `ItemList` of venues is emitted: the middleware does not fetch the city's
 * venues, and an ItemList that does not match what the page shows is worse than
 * none. Add one only alongside a real venue query.
 */
function buildCityJsonLd(metadata: PageMetadata, cityName: string, url: string): string {
  return serialiseJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: metadata.title,
    description: metadata.description,
    url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
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
    // routes that demand into the suggest flow.
    const metadata = city.isActive ? cityMetadata(city.name) : inactiveCityMetadata(city.name);
    return { metadata: { ...metadata, jsonLd: buildCityJsonLd(metadata, city.name, url) }, notFound: false };
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

  return new Response(withTags, {
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
