import { readFileSync } from "node:fs";
import process from "node:process";

/**
 * The edge runtime cannot resolve the app's "@/" alias, so middleware.ts restates
 * the static metadata table from src/lib/pageMetadata.ts. Two copies drift, and
 * the drift is only ever visible in a shared link — which nobody checks. This
 * compares them and fails the build instead.
 */

function extractPairs(source: string, startMarker: string): Map<string, { title: string; description: string }> {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find ${startMarker}`);

  // Read to the closing brace of the object literal.
  const body = source.slice(start);
  const end = body.indexOf("\n};");
  const table = body.slice(0, end);

  const pairs = new Map<string, { title: string; description: string }>();
  // Interpolations like ${brandConfig.appName} contain a closing brace, so the
  // block cannot be matched with [^}]*: that truncates the entry mid-title and
  // silently drops it, which would hide the very drift this script looks for.
  // Normalise interpolations away first, then match.
  const normalised = table.replace(/\$\{brandConfig\.appName\}|\$\{BRAND\}/g, "Nokta");
  const entry = /"(\/[^"]*)":\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entry.exec(normalised)) !== null) {
    const [, route, block] = match;
    const title = block.match(/title:\s*[`"]([^`"]*)[`"]/)?.[1];
    const description = block.match(/description:\s*"([^"]*)"/)?.[1];
    if (!title || !description) throw new Error(`Could not parse title/description for ${route} — fix the parser rather than letting the entry be skipped.`);
    pairs.set(route, { title, description });
  }

  return pairs;
}

const app = extractPairs(readFileSync("src/lib/pageMetadata.ts", "utf8"), "export const STATIC_PAGE_METADATA");

// The home route points at a shared constant rather than an inline object in both
// files, so it is not part of the table comparison; assert it exists in each.
for (const [label, file] of [["pageMetadata.ts", "src/lib/pageMetadata.ts"], ["middleware.ts", "middleware.ts"]] as const) {
  if (!readFileSync(file, "utf8").includes('"/": ')) {
    console.error(`Missing home route entry in ${label}`);
    process.exit(1);
  }
}
const edge = extractPairs(readFileSync("middleware.ts", "utf8"), "const STATIC_PAGES");

const problems: string[] = [];

for (const [route, appMeta] of app) {
  const edgeMeta = edge.get(route);
  if (!edgeMeta) {
    problems.push(`${route}: present in pageMetadata.ts but missing from middleware.ts`);
    continue;
  }
  if (appMeta.title !== edgeMeta.title) problems.push(`${route}: title differs\n  app:  ${appMeta.title}\n  edge: ${edgeMeta.title}`);
  if (appMeta.description !== edgeMeta.description) problems.push(`${route}: description differs\n  app:  ${appMeta.description}\n  edge: ${edgeMeta.description}`);
}

for (const route of edge.keys()) {
  if (!app.has(route)) problems.push(`${route}: present in middleware.ts but missing from pageMetadata.ts`);
}

/**
 * City pages are templated rather than tabled, so parity means two things: the
 * copy templates must match, and the city list the edge resolves slugs against
 * must match the app's. A city added to one and not the other would 404 for
 * crawlers while rendering fine for users.
 */
const appMeta = readFileSync("src/lib/pageMetadata.ts", "utf8");
const edgeMeta = readFileSync("middleware.ts", "utf8");

function extractTemplate(source: string, fn: string, field: "title" | "description"): string {
  const start = source.indexOf(fn);
  if (start === -1) throw new Error(`Could not find ${fn}`);
  const body = source.slice(start, source.indexOf("\n}", start));
  const value = body.match(new RegExp(`${field}: (?:venue\\.description\\?\\.trim\\(\\) \\|\\| )?\`([^\`]*)\``))?.[1];
  if (!value) throw new Error(`Could not parse ${field} from ${fn}`);
  // Both sides name their parameters differently (cityName vs city, and the venue
  // fields are read off an object); normalise the interpolations so the templates
  // compare on their copy alone.
  return value.replace(/\$\{city(Name)?\}/g, "${city}").replace(/\$\{venue\.([a-zA-Z]+)\}/g, "${$1}");
}

/**
 * A venue's description prefers the venue's own text and only falls back to the
 * template. Comparing the fallback strings alone would miss the case where one
 * renderer stops honouring the real description — the drift that actually matters,
 * since it is what makes crawler and user content diverge on most venues.
 */
function usesRealDescription(source: string, fn: string): boolean {
  const start = source.indexOf(fn);
  if (start === -1) throw new Error(`Could not find ${fn}`);
  return source.slice(start, source.indexOf("\n}", start)).includes("description?.trim() ||");
}

if (usesRealDescription(appMeta, "export function getVenuePageMetadata") !== usesRealDescription(edgeMeta, "function venueMetadata")) {
  problems.push("venue description: one renderer prefers the venue's own description and the other does not");
}

for (const [label, appFn, edgeFn] of [
  ["city", "export function getCityPageMetadata", "function cityMetadata"],
  ["inactive city", "export function getInactiveCityPageMetadata", "function inactiveCityMetadata"],
  ["venue", "export function getVenuePageMetadata", "function venueMetadata"],
] as const) {
  for (const field of ["title", "description"] as const) {
    const app = extractTemplate(appMeta, appFn, field);
    const edge = extractTemplate(edgeMeta, edgeFn, field);
    if (app !== edge) problems.push(`${label} ${field} template differs (${appFn} vs ${edgeFn})\n  app:  ${app}\n  edge: ${edge}`);
  }
}

/**
 * The venue body links to a city page by slugging the venue's city name, so the
 * edge's copy of createCitySlug must match the app's. A divergence would produce
 * internal links that 404 for crawlers only.
 */
function extractSlugBody(source: string, fn: string): string {
  const start = source.indexOf(fn);
  if (start === -1) throw new Error(`Could not find ${fn}`);
  return source
    .slice(start, source.indexOf("\n}", start))
    .replace(/^.*?\{/s, "")
    .replace(/\s+/g, "");
}

if (extractSlugBody(readFileSync("src/lib/cities.ts", "utf8"), "export function createCitySlug") !== extractSlugBody(edgeMeta, "function createCitySlug")) {
  problems.push("createCitySlug differs between src/lib/cities.ts and middleware.ts — venue body city links would not match the app's routes");
}

/**
 * The canonical host is written down in four places: the middleware's SITE_URL,
 * PageMeta's fallback, the sitemap generator's default, and robots.txt. They must
 * agree. When PageMeta fell back to the apex while the middleware used www, the
 * same page claimed one canonical to a crawler and a different one to a renderer —
 * a split signal that is invisible unless both are compared.
 */
const CANONICAL_HOST = "https://www.nokta.uk";
const hostSources: [string, string, string][] = [
  ["middleware.ts SITE_URL", edgeMeta, 'const SITE_URL = "([^"]+)"'],
  ["PageMeta.tsx FALLBACK_SITE_URL", readFileSync("src/components/seo/PageMeta.tsx", "utf8"), 'const FALLBACK_SITE_URL = "([^"]+)"'],
  ["generate-sitemap.ts default", readFileSync("scripts/generate-sitemap.ts", "utf8"), '\\|\\| "(https://[^"]+)"'],
  ["robots.txt Sitemap", readFileSync("public/robots.txt", "utf8"), "Sitemap: (https?://[^/\\s]+)"],
];

for (const [label, source, pattern] of hostSources) {
  const found = source.match(new RegExp(pattern))?.[1];
  if (!found) problems.push(`${label}: could not find the canonical host — fix the parser rather than letting it be skipped`);
  else if (found.replace(/\/$/, "") !== CANONICAL_HOST) problems.push(`${label}: is ${found}, expected ${CANONICAL_HOST}`);
}

function extractCities(source: string, marker: string): string[] {
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find ${marker}`);
  const table = source.slice(start, source.indexOf("\n];", start));
  const entries = [...table.matchAll(/slug: "([^"]+)"/g)].map(([, slug]) => slug);
  const active = [...table.matchAll(/isActive: (true|false)/g)].map(([, value]) => value);
  if (entries.length !== active.length) throw new Error(`Could not pair slugs with isActive in ${marker}`);
  return entries.map((slug, index) => `${slug}:${active[index]}`);
}

const appCities = extractCities(readFileSync("src/data/supportedCities.ts", "utf8"), "export const SUPPORTED_CITIES");
const edgeCities = extractCities(edgeMeta, "const CITIES");

if (appCities.join(",") !== edgeCities.join(",")) {
  problems.push(`city list differs between supportedCities.ts and middleware.ts\n  app:  ${appCities.join(", ")}\n  edge: ${edgeCities.join(", ")}`);
}

if (problems.length) {
  console.error("Static page metadata has drifted between the app and the edge middleware:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nEdit both tables together.");
  process.exit(1);
}

console.log(`Metadata parity OK — ${app.size} routes match.`);
