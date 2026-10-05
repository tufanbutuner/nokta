/// <reference types="node" />

/**
 * Discovers shisha venues city by city with Google Places Text Search and writes reviewable
 * seed files for `seed-real-venues.ts`.
 *
 * Replaces the London-only `discover-london-venues.ts`. Everything that script hardcoded to
 * London — the bias circle, the city name, the address check, the description wording, the
 * output path — now comes from `scripts/lib/discoveryCities.ts`, so a new city is a registry
 * entry rather than a copy of the script.
 *
 * Deliberate choices worth knowing before changing this:
 *   - `images` is always empty. Stock lounge photos were seeded here originally and then had to
 *     be undone; `backfill-venue-photos.ts` sources real ones and the UI shows a branded
 *     monogram until it does.
 *   - `rating` stays null. We do not import Google ratings.
 *   - Merge mode never overwrites a hand-curated field with a Places guess.
 *
 * Usage:
 *   npx tsx scripts/discover-venues.ts --city=london
 *   npx tsx scripts/discover-venues.ts --tranche=1
 *   npx tsx scripts/discover-venues.ts --city=birmingham --merge=data/birmingham-venues.seed.json
 *   npx tsx scripts/discover-venues.ts --tranche=3 --dry-run
 */

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { SUPPORTED_CITIES } from "../src/data/supportedCities";
import { DISCOVERY_CITIES, getCitiesInTranche, getDiscoveryCity, type DiscoveryCity } from "./lib/discoveryCities";
import { resolveArea, stripCitySuffix, type AddressComponent } from "./lib/venueArea";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const OUTPUT_DIR = "data/venues";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  // The fix for street names leaking into `area`: let Google tell us the neighbourhood.
  "places.addressComponents",
  "places.location",
  "places.businessStatus",
  "places.types",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.regularOpeningHours",
].join(",");

const QUERY_TEMPLATES = [
  "shisha lounge {area}",
  "hookah lounge {area}",
  "shisha restaurant {area}",
  "shisha bar {area}",
];

/**
 * Fields a human may have researched that Places cannot know, so merge mode keeps the curated
 * value. `images` is deliberately absent: every curated image is still a stock photo, which is
 * what commit #20 set about removing, and `backfill-venue-photos.ts` sources real ones instead.
 */
const CURATED_FIELDS = ["priceFrom", "priceLevel", "area", "description", "sourceNotes", "instagram", "halal", "vibes", "secondaryCategories", "outdoor"] as const;

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude?: number; longitude?: number };
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  types?: string[];
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  regularOpeningHours?: {
    periods?: Array<{
      open?: { day?: number; hour?: number; minute?: number };
      close?: { day?: number; hour?: number; minute?: number };
    }>;
  };
};

type SeedVenue = Record<string, unknown> & { id: string; slug: string; name: string; area: string };

/** Curated venues keyed for lookup, plus which of them a run actually matched. */
type CuratedIndex = { byKey: Map<string, SeedVenue>; matched: Set<string>; all: SeedVenue[] };

/** A UK postcode anywhere in the address, which a foreign address will not have. */
const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

/** Countries whose cities share a name with a UK one; seen in real results. */
const NON_UK_ADDRESS = /\b(australia|usa|united states|canada|new zealand|south africa|ireland|nsw|qld|victoria \d)\b/i;

/** A place plus the query context it was found through, so area fallback has something to use. */
type Candidate = { place: GooglePlace; queriedArea: string; cityName: string; citySlug: string };

async function main() {
  if (process.argv.includes("--help")) return printHelp();

  const dryRun = process.argv.includes("--dry-run");
  const cities = resolveTargetCities();
  const perCityLimit = Number(getArgValue("--limit") ?? "200");

  const projectedCalls = cities.reduce((total, city) => total + city.areas.length * QUERY_TEMPLATES.length, 0);
  console.log(`Cities: ${cities.map((city) => city.slug).join(", ")}`);
  console.log(`Projected Text Search calls: ${projectedCalls} (quota is per day — check before large tranches).`);

  if (dryRun) {
    console.log("\n--dry-run: no API calls made.");
    for (const city of cities) {
      console.log(`  ${city.slug}: ${city.areas.length} areas x ${QUERY_TEMPLATES.length} templates = ${city.areas.length * QUERY_TEMPLATES.length} calls`);
    }
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in .env.local.");

  // Shared across cities so overlapping bias circles cannot list one venue twice.
  const seenPlaceIds = new Set<string>();
  let callCount = 0;

  for (const city of cities) {
    const cityMeta = SUPPORTED_CITIES.find((entry) => entry.slug === city.slug);
    if (!cityMeta) throw new Error(`City "${city.slug}" is missing from SUPPORTED_CITIES — add it there first.`);

    const candidates = new Map<string, Candidate>();

    for (const area of city.areas) {
      for (const template of QUERY_TEMPLATES) {
        const query = template.replace("{area}", area);
        const places = await searchText(apiKey, query, cityMeta, city.radiusKm);
        callCount += 1;

        let added = 0;
        for (const place of places) {
          if (!isUsablePlace(place, city)) continue;
          if (seenPlaceIds.has(place.id)) continue;
          if (candidates.has(place.id)) continue;
          candidates.set(place.id, { place, queriedArea: area, cityName: cityMeta.name, citySlug: city.slug });
          added += 1;
        }

        console.log(`  [${city.slug}] ${query}: ${places.length} result(s), +${added} new (${candidates.size} total)`);
        await wait(120);
      }

      // Per-area budgeting: the old global limit broke the loop early and starved later areas.
      if (candidates.size >= perCityLimit) {
        console.log(`  [${city.slug}] reached per-city limit of ${perCityLimit}; stopping early.`);
        break;
      }
    }

    for (const id of candidates.keys()) seenPlaceIds.add(id);
    writeCityOutput(city, Array.from(candidates.values()));
  }

  console.log(`\nDone. ${callCount} Text Search call(s) used. ${seenPlaceIds.size} unique place(s) across all cities.`);
  console.log("Review the generated files, then seed with: npx tsx scripts/seed-real-venues.ts <file>");
}

function writeCityOutput(city: DiscoveryCity, candidates: Candidate[]) {
  const confirmed = candidates.filter(({ place }) => isExplicitShishaVenue(place));
  const ambiguous = candidates.filter(({ place }) => !isExplicitShishaVenue(place));

  const mergePath = getArgValue("--merge");
  const curated: CuratedIndex = mergePath ? readCuratedSeed(mergePath) : { byKey: new Map(), matched: new Set(), all: [] };

  const slugCounts = new Map<string, number>();
  const confirmedVenues = confirmed.map((candidate) => mergeCurated(toSeedVenue(candidate, slugCounts), curated));
  const ambiguousVenues = ambiguous.map((candidate) => mergeCurated(toSeedVenue(candidate, slugCounts), curated));

  const outputPath = path.resolve(process.cwd(), `${OUTPUT_DIR}/${city.slug}.generated.json`);
  const reviewPath = path.resolve(process.cwd(), `${OUTPUT_DIR}/${city.slug}-review-needed.generated.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(confirmedVenues, null, 2)}\n`);
  fs.writeFileSync(reviewPath, `${JSON.stringify(ambiguousVenues, null, 2)}\n`);

  const unmatchedCurated = curated.all.filter((entry) => !curated.matched.has(entry.slug));

  console.log(`  [${city.slug}] wrote ${confirmedVenues.length} confirmed -> ${path.relative(process.cwd(), outputPath)}`);
  console.log(`  [${city.slug}] wrote ${ambiguousVenues.length} needing review -> ${path.relative(process.cwd(), reviewPath)}`);
  if (unmatchedCurated.length) {
    console.log(`  [${city.slug}] WARNING: ${unmatchedCurated.length} curated venue(s) were not rediscovered and are NOT in the output:`);
    for (const entry of unmatchedCurated) console.log(`      - ${entry.slug} (${entry.name})`);
    console.log(`      Keep seeding the original curated file for those, or add them by hand.`);
  }
}

/**
 * Keeps hand-researched values when re-running discovery over a curated city. Places can tell us
 * an address changed; it cannot tell us the shisha menu starts at £13, so curated wins on those.
 */
function mergeCurated(venue: SeedVenue, curated: CuratedIndex): SeedVenue {
  const existing =
    curated.byKey.get(nameKey(venue.name)) ?? curated.byKey.get(venue.slug) ?? curated.byKey.get(String(venue.id));
  if (!existing) return venue;
  curated.matched.add(existing.slug);

  const merged: SeedVenue = { ...venue };
  for (const field of CURATED_FIELDS) {
    const value: unknown = existing[field];
    const isEmpty = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    // SeedVenue is an open record, so a curated field is copied across as-is.
    if (!isEmpty) (merged as Record<string, unknown>)[field] = value;
  }

  // Keep the curated slug and id: they are already seeded in Supabase and referenced by
  // existing URLs, so re-slugging a known venue would orphan its row and its links.
  merged.slug = existing.slug;
  merged.id = existing.id ?? existing.slug;

  // `seed-real-venues.ts` rejects anything other than "partially-verified", so a curated
  // "verified" must not be carried through here or seeding fails validation.
  merged.verificationStatus = "partially-verified";
  merged.dataSources = { ...(existing.dataSources as object), ...(venue.dataSources as object) };
  merged.sourceNotes = existing.sourceNotes ?? venue.sourceNotes;
  return merged;
}

/**
 * Indexes curated venues for lookup. A discovered slug carries the resolved area
 * ("rotana-shisha-lounge-highgate") while the curated one usually does not
 * ("rotana-shisha-lounge"), so matching on slug alone silently misses almost everything.
 * The venue name, normalised, is the stable join key; slug and id are kept as extra keys.
 */
function readCuratedSeed(seedPath: string) {
  const resolved = path.resolve(process.cwd(), seedPath);
  if (!fs.existsSync(resolved)) throw new Error(`--merge file not found: ${seedPath}`);
  const parsed = JSON.parse(fs.readFileSync(resolved, "utf-8")) as SeedVenue[];
  const index: CuratedIndex = { byKey: new Map(), matched: new Set(), all: parsed };
  for (const venue of parsed) {
    index.byKey.set(nameKey(venue.name), venue);
    index.byKey.set(venue.slug, venue);
    if (venue.id) index.byKey.set(String(venue.id), venue);
  }
  console.log(`  merging curated data from ${seedPath} (${parsed.length} venue(s))`);
  return index;
}

/** Lowercase alphanumerics only, so "Shisha-Wala" and "Shisha Wala" are one venue. */
function nameKey(name: string) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function searchText(apiKey: string, query: string, cityMeta: { latitude: number; longitude: number }, radiusKm: number): Promise<GooglePlace[]> {
  const response = await fetch(TEXT_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      regionCode: "GB",
      locationBias: { circle: { center: { latitude: cityMeta.latitude, longitude: cityMeta.longitude }, radius: radiusKm * 1000 } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    // A quota refusal should stop the run, not be retried into a bigger bill.
    throw new Error(`Google Places request failed for "${query}": ${response.status} ${text}`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return payload.places ?? [];
}

function toSeedVenue({ place, queriedArea, cityName, citySlug }: Candidate, slugCounts: Map<string, number>): SeedVenue {
  const name = place.displayName?.text?.trim() || "Unnamed venue";
  const address = place.formattedAddress?.replace(/,?\s*UK$/i, "").trim() || "";
  const area = resolveArea({
    addressComponents: place.addressComponents,
    formattedAddress: address,
    cityName,
    citySlug,
    postcode: getPostcode(address),
    queriedArea: stripCitySuffix(queriedArea, cityName),
  });
  const types = place.types ?? [];
  const food = hasAnyType(types, ["restaurant", "food", "meal_takeaway", "cafe"]);
  const alcohol = hasAnyType(types, ["bar", "night_club"]);
  const openLate = hasLateHours(place);
  const slug = uniqueSlug(name, area, slugCounts);

  return {
    id: slug,
    slug,
    name,
    description: buildDescription({ name, area, cityName, food, alcohol, openLate, website: place.websiteUri ?? null }),
    country: "United Kingdom",
    city: cityName,
    area,
    address,
    postcode: getPostcode(address),
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
    rating: null,
    priceFrom: null,
    priceLevel: 2,
    primaryCategory: "shisha_lounge",
    secondaryCategories: buildSecondaryCategories({ food, alcohol, openLate, name }),
    indoor: true,
    outdoor: /garden|terrace|roof|courtyard/i.test(name),
    food,
    alcohol,
    openLate,
    vibes: buildVibes({ food, alcohol, openLate, name }),
    // Left empty on purpose — see the file header.
    images: [],
    openingHours: buildOpeningHours(place),
    website: place.websiteUri ?? null,
    instagram: null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    businessStatus: mapBusinessStatus(place.businessStatus),
    verificationStatus: "partially-verified",
    lastVerifiedAt: new Date().toISOString(),
    dataSources: buildDataSources(place),
    sourceNotes:
      "Generated from Google Places Text Search for discovery only. Google ratings and photos are intentionally not imported. Run the photo backfill for real imagery, and verify shisha availability and pricing before public launch.",
  };
}

function resolveTargetCities(): DiscoveryCity[] {
  const citySlugs = getListArg("--city") ?? getListArg("--cities");
  const tranche = getArgValue("--tranche");

  if (citySlugs?.length) {
    return citySlugs.map((slug) => {
      const city = getDiscoveryCity(slug);
      if (!city) throw new Error(`Unknown city "${slug}". Known: ${DISCOVERY_CITIES.map((entry) => entry.slug).join(", ")}`);
      return city;
    });
  }

  if (tranche) {
    const cities = getCitiesInTranche(Number(tranche));
    if (!cities.length) throw new Error(`No cities in tranche ${tranche}.`);
    return cities;
  }

  throw new Error("Pass --city=<slug> (comma-separated for several) or --tranche=<n>. See --help.");
}

function isUsablePlace(place: GooglePlace, city: DiscoveryCity) {
  const name = place.displayName?.text?.toLowerCase() ?? "";
  const address = place.formattedAddress?.toLowerCase() ?? "";
  const hasLocation = typeof place.location?.latitude === "number" && typeof place.location?.longitude === "number";
  const inCatchment = city.addressMatchers.some((matcher) => address.includes(matcher.toLowerCase()));
  // Several UK city names exist abroad, and a location bias is a preference, not a filter:
  // a "shisha lounge Liverpool" search returned a venue in Liverpool, New South Wales, whose
  // address contains "liverpool" and so passed the catchment check. Require a UK postcode and
  // reject an address that names another country.
  const isUk = UK_POSTCODE.test(place.formattedAddress ?? "") && !NON_UK_ADDRESS.test(address);
  const looksRelevant = /shisha|hookah|sheesha|sisha|lounge|cafe|café|restaurant|bar/.test(name);
  // Permanently-closed venues are hidden from users anyway, so do not seed new ones.
  const isOpen = place.businessStatus !== "CLOSED_PERMANENTLY";
  return Boolean(place.id && hasLocation && isUk && inCatchment && looksRelevant && isOpen);
}

function isExplicitShishaVenue(place: GooglePlace) {
  return /shisha|hookah|sheesha|sisha|lounge/i.test(place.displayName?.text ?? "");
}

/** Slugs must be unique: two "Cloud Lounge" in one city would otherwise collide on upsert. */
function uniqueSlug(name: string, area: string, slugCounts: Map<string, number>) {
  const base = slugify(name);
  const areaSlug = slugify(area);
  const candidate = areaSlug && !base.includes(areaSlug) ? `${base}-${areaSlug}` : base;
  const seen = slugCounts.get(candidate) ?? 0;
  slugCounts.set(candidate, seen + 1);
  return seen === 0 ? candidate : `${candidate}-${seen + 1}`;
}

function buildDescription(input: { name: string; area: string; cityName: string; food: boolean; alcohol: boolean; openLate: boolean; website: string | null }) {
  const features: string[] = [];
  if (input.food && input.alcohol) features.push("food and drinks");
  else if (input.food) features.push("food");
  else if (input.alcohol) features.push("drinks");
  if (/garden|terrace|roof|riverside/i.test(input.name)) features.push("outdoor seating");
  if (input.openLate) features.push("late opening");

  const featureText = features.length ? ` with ${features.join(", ")}` : "";
  const place = input.area && input.area !== input.cityName ? `${input.area}, ${input.cityName}` : input.cityName;
  const sourceLine = input.website ? "Check the venue website before travelling or booking." : "Check directly with the venue before travelling or booking.";
  return `${cleanVenueName(input.name)} is a spot for shisha in ${place}${featureText}. ${sourceLine}`;
}

function cleanVenueName(name: string) {
  return name.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getPostcode(address: string) {
  return address.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0]?.toUpperCase() ?? "";
}

function hasAnyType(types: string[], candidates: string[]) {
  return candidates.some((candidate) => types.includes(candidate));
}

function hasLateHours(place: GooglePlace) {
  return (place.regularOpeningHours?.periods ?? []).some((period) => {
    const closeHour = period.close?.hour;
    return typeof closeHour === "number" && closeHour >= 0 && closeHour <= 2;
  });
}

function buildSecondaryCategories(input: { food: boolean; alcohol: boolean; openLate: boolean; name: string }) {
  const categories = new Set<string>(["shisha", "groups"]);
  if (input.food) categories.add("food");
  if (input.alcohol) categories.add("cocktails");
  if (input.openLate) categories.add("late_night");
  if (/sport|football|screen/i.test(input.name)) categories.add("live_sport");
  return Array.from(categories);
}

function buildVibes(input: { food: boolean; alcohol: boolean; openLate: boolean; name: string }) {
  const vibes = new Set<string>(["casual", "groups"]);
  if (input.openLate) vibes.add("late-night");
  if (/garden|terrace|outdoor|roof/i.test(input.name)) vibes.add("outdoor");
  if (/lux|vip|premium|club/i.test(input.name)) vibes.add("luxury");
  if (/sport|football|screen/i.test(input.name)) vibes.add("football");
  if (input.food || input.alcohol) vibes.add("date-night");
  return Array.from(vibes);
}

function buildOpeningHours(place: GooglePlace) {
  return (place.regularOpeningHours?.periods ?? [])
    .filter((period) => period.open && period.close)
    .map((period) => ({
      day: dayName(period.open?.day ?? 0),
      open: formatTime(period.open?.hour ?? 0, period.open?.minute ?? 0),
      close: formatTime(period.close?.hour ?? 0, period.close?.minute ?? 0),
    }));
}

function dayName(day: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day] ?? "Monday";
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function mapBusinessStatus(status: GooglePlace["businessStatus"]) {
  if (status === "OPERATIONAL") return "open";
  if (status === "CLOSED_TEMPORARILY") return "temporarily-closed";
  if (status === "CLOSED_PERMANENTLY") return "permanently-closed";
  return "unknown";
}

function buildDataSources(place: GooglePlace) {
  const sources: Record<string, string> = { directorySource: "Google Places API Text Search" };
  if (place.websiteUri) sources.officialWebsite = place.websiteUri;
  if (place.googleMapsUri) sources.otherSource = place.googleMapsUri;
  return sources;
}

function getArgValue(name: string) {
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function getListArg(name: string) {
  return getArgValue(name)?.split(",").map((item) => item.trim()).filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Discover shisha venues per city with Google Places and write reviewable seed files.

Usage:
  npx tsx scripts/discover-venues.ts --city=london
  npx tsx scripts/discover-venues.ts --city=birmingham,manchester
  npx tsx scripts/discover-venues.ts --tranche=1
  npx tsx scripts/discover-venues.ts --tranche=3 --dry-run
  npx tsx scripts/discover-venues.ts --city=birmingham --merge=data/birmingham-venues.seed.json

Options:
  --city=<slug[,slug]>  Cities to discover, by registry slug.
  --tranche=<n>         Every city in that tranche.
  --limit=<n>           Max venues per city (default 200).
  --merge=<path>        Preserve hand-curated fields from an existing seed file.
  --dry-run             Print the projected API call count and exit.

Output:
  data/venues/<city>.generated.json
  data/venues/<city>-review-needed.generated.json

Required env:
  GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
