/// <reference types="node" />

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_OUTPUT_PATH = "data/london-venues.generated.json";
const DEFAULT_REVIEW_OUTPUT_PATH = "data/london-venues-review-needed.generated.json";
const LONDON_CENTER = { latitude: 51.5074, longitude: -0.1278 };
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.businessStatus",
  "places.types",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.regularOpeningHours",
].join(",");

const DEFAULT_AREAS = [
  "Central London",
  "Soho",
  "Mayfair",
  "Marylebone",
  "Edgware Road",
  "Camden",
  "Shoreditch",
  "Dalston",
  "Hackney",
  "Islington",
  "Brixton",
  "Clapham",
  "Tooting",
  "Croydon",
  "Greenwich",
  "Wembley",
  "Harrow",
  "Ealing",
  "Acton",
  "Hounslow",
  "Ilford",
  "Stratford",
  "Kingston",
  "Bromley",
];

const QUERY_TEMPLATES = [
  "shisha lounge {area}",
  "hookah lounge {area}",
  "shisha restaurant {area}",
  "shisha bar {area}",
];

const STOCK_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=85",
];

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
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

type SeedVenue = {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: "United Kingdom";
  city: "London";
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating: null;
  priceFrom: null;
  priceLevel: 1 | 2 | 3 | 4;
  primaryCategory: "shisha_lounge";
  secondaryCategories: string[];
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  openLate: boolean;
  vibes: string[];
  images: string[];
  openingHours: Array<{ day: string; open: string; close: string }>;
  website: string | null;
  instagram: null;
  phone: string | null;
  businessStatus: "open" | "temporarily-closed" | "permanently-closed" | "unknown";
  verificationStatus: "partially-verified";
  lastVerifiedAt: string;
  dataSources: Record<string, string>;
  sourceNotes: string;
};

async function main() {
  if (process.argv.includes("--help")) {
    printHelp();
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in .env.local.");
  }

  const outputPath = path.resolve(process.cwd(), getArgValue("--output") ?? DEFAULT_OUTPUT_PATH);
  const reviewOutputPath = path.resolve(process.cwd(), getArgValue("--review-output") ?? DEFAULT_REVIEW_OUTPUT_PATH);
  const limit = Number(getArgValue("--limit") ?? "120");
  const areas = getListArg("--areas") ?? DEFAULT_AREAS;
  const queries = buildQueries(areas);
  const placesById = new Map<string, GooglePlace>();

  for (const query of queries) {
    const places = await searchText(apiKey, query);
    for (const place of places) {
      if (isUsablePlace(place)) {
        placesById.set(place.id, place);
      }
    }
    console.log(`${query}: ${places.length} result(s), ${placesById.size} unique candidate(s)`);
    await wait(120);

    if (placesById.size >= limit) break;
  }

  const candidates = Array.from(placesById.values()).slice(0, limit);
  const shishaVenues = candidates.filter(isExplicitShishaVenue).map(toSeedVenue);
  const reviewVenues = candidates.filter((place) => !isExplicitShishaVenue(place)).map(toSeedVenue);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(reviewOutputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(shishaVenues, null, 2)}\n`);
  fs.writeFileSync(reviewOutputPath, `${JSON.stringify(reviewVenues, null, 2)}\n`);

  console.log(`Wrote ${shishaVenues.length} explicit shisha/lounge venues to ${path.relative(process.cwd(), outputPath)}.`);
  console.log(`Wrote ${reviewVenues.length} ambiguous venues to ${path.relative(process.cwd(), reviewOutputPath)}.`);
  console.log("Review both files before running the Supabase seed command.");
}

async function searchText(apiKey: string, query: string): Promise<GooglePlace[]> {
  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      regionCode: "GB",
      locationBias: {
        circle: {
          center: LONDON_CENTER,
          radius: 45000,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places request failed for "${query}": ${response.status} ${text}`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return payload.places ?? [];
}

function toSeedVenue(place: GooglePlace, index: number): SeedVenue {
  const name = place.displayName?.text?.trim() || "Unnamed venue";
  const address = place.formattedAddress?.replace(/, UK$/, "").trim() || "";
  const postcode = getPostcode(address);
  const area = getArea(address);
  const types = place.types ?? [];
  const food = hasAnyType(types, ["restaurant", "food", "meal_takeaway", "cafe"]);
  const alcohol = hasAnyType(types, ["bar", "night_club"]);
  const openLate = hasLateHours(place);
  const slug = uniqueSlug(name, area);

  return {
    id: slug,
    slug,
    name,
    description: buildDescription({ name, area, food, alcohol, openLate, website: place.websiteUri ?? null }),
    country: "United Kingdom",
    city: "London",
    area,
    address,
    postcode,
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
    rating: null,
    priceFrom: null,
    priceLevel: 2,
    primaryCategory: "shisha_lounge",
    secondaryCategories: buildSecondaryCategories({ food, alcohol, openLate, name }),
    indoor: true,
    outdoor: false,
    food,
    alcohol,
    openLate,
    vibes: buildVibes({ food, alcohol, openLate, name }),
    images: buildStockImages(index),
    openingHours: buildOpeningHours(place),
    website: place.websiteUri ?? null,
    instagram: null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    businessStatus: mapBusinessStatus(place.businessStatus),
    verificationStatus: "partially-verified",
    lastVerifiedAt: new Date().toISOString(),
    dataSources: buildDataSources(place),
    sourceNotes:
      "Generated from Google Places Text Search for discovery only. Google ratings and photos are intentionally not imported. Replace stock images with owned or venue-approved media, and verify shisha availability/pricing before public launch.",
  };
}

function buildQueries(areas: string[]) {
  return areas.flatMap((area) => QUERY_TEMPLATES.map((template) => template.replace("{area}", `${area} London`)));
}

function isUsablePlace(place: GooglePlace) {
  const name = place.displayName?.text?.toLowerCase() ?? "";
  const address = place.formattedAddress?.toLowerCase() ?? "";
  const hasLocation = typeof place.location?.latitude === "number" && typeof place.location?.longitude === "number";
  const isLondonish = address.includes("london") || address.includes("middlesex") || address.includes("surrey") || address.includes("essex");
  const looksRelevant = /shisha|hookah|lounge|cafe|restaurant|bar/.test(name);
  return Boolean(place.id && hasLocation && isLondonish && looksRelevant);
}

function isExplicitShishaVenue(place: GooglePlace) {
  const name = place.displayName?.text ?? "";
  return /shisha|hookah|sheesha|sisha|lounge/i.test(name);
}

function uniqueSlug(name: string, area: string) {
  const base = slugify(name);
  const areaSlug = slugify(area);
  return areaSlug && !base.includes(areaSlug) ? `${base}-${areaSlug}` : base;
}

function buildDescription(input: { name: string; area: string; food: boolean; alcohol: boolean; openLate: boolean; website: string | null }) {
  const area = input.area && !/^\d/.test(input.area) ? input.area : "London";
  const features = [];
  if (input.food && input.alcohol) features.push("food and drinks");
  else if (input.food) features.push("food");
  else if (input.alcohol) features.push("drinks");
  if (/garden|terrace|roof|riverside/i.test(input.name)) features.push("outdoor seating");
  if (input.openLate) features.push("late opening");

  const featureText = features.length ? ` with ${features.join(", ")}` : "";
  const sourceLine = input.website ? "Check the venue website before travelling or booking." : "Check directly with the venue before travelling or booking.";
  return `${cleanVenueName(input.name)} is a London spot for shisha in ${area}${featureText}. ${sourceLine}`;
}

function cleanVenueName(name: string) {
  return name.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPostcode(address: string) {
  return address.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0]?.toUpperCase() ?? "";
}

function getArea(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const postcode = getPostcode(address);
  const londonPartIndex = parts.findIndex((part) => /^London\b/i.test(part));
  const candidate = londonPartIndex > 0 ? parts[londonPartIndex - 1] : parts[parts.length - 3];
  return candidate?.replace(postcode, "").trim() || "London";
}

function hasAnyType(types: string[], candidates: string[]) {
  return candidates.some((candidate) => types.includes(candidate));
}

function hasLateHours(place: GooglePlace) {
  return (place.regularOpeningHours?.periods ?? []).some((period) => {
    const closeHour = period.close?.hour;
    return typeof closeHour === "number" && (closeHour >= 0 && closeHour <= 2);
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
  if (/lux|vip|maya|mayfair|premium|club/i.test(input.name)) vibes.add("luxury");
  if (/sport|football|screen/i.test(input.name)) vibes.add("football");
  if (input.food || input.alcohol) vibes.add("date-night");
  return Array.from(vibes);
}

function buildStockImages(index: number) {
  const first = STOCK_IMAGE_POOL[index % STOCK_IMAGE_POOL.length];
  const second = STOCK_IMAGE_POOL[(index + 3) % STOCK_IMAGE_POOL.length];
  return first === second ? [first] : [first, second];
}

function buildOpeningHours(place: GooglePlace) {
  const periods = place.regularOpeningHours?.periods ?? [];
  return periods
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

function mapBusinessStatus(status: GooglePlace["businessStatus"]): SeedVenue["businessStatus"] {
  if (status === "OPERATIONAL") return "open";
  if (status === "CLOSED_TEMPORARILY") return "temporarily-closed";
  if (status === "CLOSED_PERMANENTLY") return "permanently-closed";
  return "unknown";
}

function buildDataSources(place: GooglePlace) {
  const sources: Record<string, string> = {
    directorySource: "Google Places API Text Search",
  };

  if (place.websiteUri) sources.officialWebsite = place.websiteUri;
  if (place.googleMapsUri) sources.otherSource = place.googleMapsUri;
  return sources;
}

function getArgValue(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg?.slice(name.length + 1);
}

function getListArg(name: string) {
  const value = getArgValue(name);
  return value?.split(",").map((item) => item.trim()).filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Discover London venues with Google Places and write a reviewable seed file.

Usage:
  npm run discover:venues:london
  npm run discover:venues:london -- --limit=160 --output=data/london-venues.generated.json
  npm run discover:venues:london -- --review-output=data/london-venues-review-needed.generated.json
  npm run discover:venues:london -- --areas=Soho,Camden,Hounslow

Required env:
  GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
