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
}

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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** A venue's own metadata, read straight from the public venues table. */
async function getVenueMetadata(slug: string): Promise<PageMetadata | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const query = `${supabaseUrl}/rest/v1/venues?slug=eq.${encodeURIComponent(slug)}&select=name,city,area,description,images&limit=1`;
    const response = await fetch(query, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;

    const rows = (await response.json()) as { name: string; city: string; area: string; description: string | null; images: string[] | null }[];
    const venue = rows[0];
    if (!venue) return null;

    return {
      title: `${venue.name} in ${venue.city} | nokta`,
      description: venue.description?.trim() || `View opening hours, photos, features and booking details for ${venue.name} in ${venue.area}, ${venue.city}.`,
      image: venue.images?.[0],
    };
  } catch {
    // A slow or failing lookup must never block the page: fall back to site defaults.
    return null;
  }
}

async function getMetadata(pathname: string): Promise<PageMetadata> {
  const normalised = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const staticPage = STATIC_PAGES[normalised];
  if (staticPage) return staticPage;

  const venueMatch = normalised.match(/^\/venues\/([^/]+)$/);
  if (venueMatch) return (await getVenueMetadata(venueMatch[1])) ?? SITE_FALLBACK;

  return SITE_FALLBACK;
}

function buildTags(metadata: PageMetadata, url: string): string {
  const image = absoluteUrl(metadata.image ?? DEFAULT_OG_IMAGE);
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
  ].join("\n    ");
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!CRAWLER_PATTERN.test(userAgent)) return next();

  const url = new URL(request.url);
  const response = await fetch(new URL("/index.html", url.origin), { headers: { "user-agent": "nokta-middleware" } });
  if (!response.ok) return next();

  const html = await response.text();
  const metadata = await getMetadata(url.pathname);
  const canonical = `${SITE_URL}${url.pathname}`;

  // Replace the placeholder title rather than leaving two in the document.
  const withTags = html.replace(/<title>.*?<\/title>/i, "").replace("</head>", `  ${buildTags(metadata, canonical)}\n  </head>`);

  return new Response(withTags, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Crawlers re-fetch on every share; caching keeps the Supabase lookup rare.
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "x-nokta-prerender": "crawler",
    },
  });
}
