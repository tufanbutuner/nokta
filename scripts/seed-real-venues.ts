/// <reference types="node" />

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

// Warning: this script upserts seeded venue fields and may overwrite manual admin edits.
const LEGACY_DEMO_VENUE_IDS = ["maya", "huqqa", "hayatt", "tigerbay", "cloud", "garden", "maison", "shore", "terrace", "roof"];

type SeedVenue = {
  id: string;
  slug: string;
  name: string;
  description: string;
  country?: string;
  city?: string;
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  priceFrom: number | null;
  priceLevel: 1 | 2 | 3 | 4;
  primaryCategory?: string;
  secondaryCategories?: string[];
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  halal?: boolean;
  openLate: boolean;
  vibes: string[];
  images: string[];
  openingHours: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  businessStatus: "open" | "temporarily-closed" | "permanently-closed" | "unknown";
  verificationStatus: "unverified" | "partially-verified" | "verified";
  lastVerifiedAt: string | null;
  dataSources: Record<string, string>;
  sourceNotes: string | null;
};

function toVenueRow(venue: SeedVenue) {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    description: venue.description,
    country: getSeedCountry(venue),
    city: getSeedCity(venue),
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    rating: venue.rating,
    price_from: venue.priceFrom,
    price_level: venue.priceLevel,
    primary_category: venue.primaryCategory ?? "shisha_lounge",
    secondary_categories: venue.secondaryCategories ?? ["shisha"],
    indoor: venue.indoor,
    outdoor: venue.outdoor,
    food: venue.food,
    alcohol: venue.alcohol,
    halal: venue.halal ?? false,
    open_late: venue.openLate,
    vibes: venue.vibes,
    images: venue.images,
    opening_hours: venue.openingHours,
    website: venue.website,
    instagram: venue.instagram,
    phone: venue.phone,
    business_status: venue.businessStatus,
    verification_status: venue.verificationStatus,
    last_verified_at: venue.lastVerifiedAt,
    data_sources: venue.dataSources,
    source_notes: venue.sourceNotes,
    updated_at: new Date().toISOString(),
  };
}

function validateVenue(venue: SeedVenue): string[] {
  const errors: string[] = [];
  const country = getSeedCountry(venue);
  const city = getSeedCity(venue);

  if (!venue.id) errors.push("missing id");
  if (!venue.slug) errors.push("missing slug");
  if (!venue.name) errors.push("missing name");
  if (!venue.description) errors.push("missing description");
  if (!country) errors.push("missing country");
  if (!city) errors.push("missing city");
  if (!venue.area) errors.push("missing area");
  if (!venue.address) errors.push("missing address");
  if (!venue.postcode) errors.push("missing postcode");

  if (typeof venue.latitude !== "number" || Number.isNaN(venue.latitude)) {
    errors.push("invalid latitude");
  }

  if (typeof venue.longitude !== "number" || Number.isNaN(venue.longitude)) {
    errors.push("invalid longitude");
  }

  if (venue.rating !== null) {
    errors.push("rating must remain null until Sheesha owns or licenses ratings");
  }

  if (![1, 2, 3, 4].includes(venue.priceLevel)) {
    errors.push("invalid priceLevel");
  }

  if (!Array.isArray(venue.vibes)) {
    errors.push("vibes must be an array");
  }

  if (!Array.isArray(venue.images)) {
    errors.push("images must be an array");
  }

  if (!Array.isArray(venue.openingHours)) {
    errors.push("openingHours must be an array");
  }

  if (venue.verificationStatus !== "partially-verified") {
    errors.push("verificationStatus must be partially-verified for this batch");
  }

  if (!venue.dataSources || Object.keys(venue.dataSources).length === 0) {
    errors.push("missing dataSources");
  }

  return errors;
}

async function main() {
  const seedPath = path.resolve(process.cwd(), getSeedPathArg());
  const isDefaultSeed = path.basename(seedPath) === "real-venues.seed.json";
  const rawSeed = fs.readFileSync(seedPath, "utf-8");
  const venues = JSON.parse(rawSeed) as SeedVenue[];

  if (isDefaultSeed && venues.length !== 21) {
    throw new Error(`Expected 21 real venues, found ${venues.length}.`);
  }

  const validationErrors = venues.flatMap((venue) => validateVenue(venue).map((error) => `${venue.id || "unknown"}: ${error}`));

  if (validationErrors.length > 0) {
    console.error("Seed validation failed:");
    for (const error of validationErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  if (process.argv.includes("--validate-only")) {
    console.log(`Validated ${venues.length} venues from ${path.relative(process.cwd(), seedPath)}.`);
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to your .env.local file.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const rows = venues.map(toVenueRow);
  const { error } = await supabase.from("venues").upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }

  if (isDefaultSeed) {
    const { error: deleteLegacyError } = await supabase.from("venues").delete().in("id", LEGACY_DEMO_VENUE_IDS);

    if (deleteLegacyError) {
      throw new Error(deleteLegacyError.message);
    }
  }

  console.log(`Seeded ${rows.length} venues into Supabase.`);
}

function getSeedPathArg() {
  return process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "data/real-venues.seed.json";
}

function getSeedCountry(venue: SeedVenue) {
  return venue.country?.trim() || "United Kingdom";
}

function getSeedCity(venue: SeedVenue) {
  return venue.city?.trim() || "London";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
