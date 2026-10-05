/// <reference types="node" />

/**
 * Reconciles a discovery file against the venues already in Supabase.
 *
 * `seed-real-venues.ts` upserts on `id`, which is the right thing for a first import and the
 * wrong thing for a re-run: discovery derives the slug (and therefore the id) from the resolved
 * area, so improving area resolution changes the slug of a venue that is already seeded. Seeding
 * the file directly would insert a second copy of that venue and leave the original behind,
 * still carrying the old area, its photos, its booking requests and any owner claim.
 *
 * This script matches each discovered venue to an existing row and writes only the columns that
 * discovery is the authority for. Everything a human, an owner or the photo backfill produced is
 * left alone.
 *
 * Matching, in order:
 *   1. Google CID from the Maps URI in `data_sources.otherSource` — a stable place identifier.
 *   2. Normalised name within the same city.
 *   3. Postcode plus normalised name, for venues that were renamed slightly.
 * A venue that matches nothing is new and gets inserted.
 *
 * Usage:
 *   npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json --dry-run
 *   npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json
 *   npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json --apply-areas-only
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

/**
 * Columns discovery owns and may overwrite on an existing row. Everything else — images,
 * price_from, instagram, description, is_claimed, partner_tier, monetisation_*, featured_*,
 * halal, vibes, rating — belongs to a human, an owner or the photo backfill, so it is never
 * touched here even when the discovery file carries a value.
 */
const DISCOVERY_OWNED_COLUMNS = [
  "area",
  "address",
  "postcode",
  "latitude",
  "longitude",
  "website",
  "phone",
  "opening_hours",
  "open_late",
  "business_status",
  "food",
  "alcohol",
  "outdoor",
] as const;

/** Columns that are only safe to set when the existing row has nothing there. */
const FILL_IF_EMPTY_COLUMNS = ["primary_category", "secondary_categories"] as const;

type VenueRow = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  area: string | null;
  postcode: string | null;
  images: string[] | null;
  data_sources: Record<string, unknown> | null;
  is_test: boolean | null;
};

type DiscoveredVenue = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string;
  postcode: string;
};

type Plan = {
  updates: Array<{ row: VenueRow; venue: DiscoveredVenue; changes: Record<string, unknown>; matchedBy: string }>;
  inserts: DiscoveredVenue[];
  unchanged: number;
  orphans: VenueRow[];
};

async function main() {
  if (process.argv.includes("--help")) return printHelp();

  const filePath = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!filePath) throw new Error("Pass a discovery file, e.g. data/venues/london.generated.json");

  const dryRun = process.argv.includes("--dry-run");
  const areasOnly = process.argv.includes("--apply-areas-only");

  const resolved = path.resolve(process.cwd(), filePath);
  const discovered = JSON.parse(fs.readFileSync(resolved, "utf-8")) as DiscoveredVenue[];
  if (!discovered.length) throw new Error(`${filePath} is empty.`);

  const cities = Array.from(new Set(discovered.map((venue) => venue.city)));
  console.log(`Discovery file: ${path.relative(process.cwd(), resolved)} (${discovered.length} venue(s), city: ${cities.join(", ")})`);

  const db = createDbClient();
  const { data, error } = await db.from("venues").select("*").in("city", cities);
  if (error) throw new Error(`Could not read venues: ${error.message}`);
  const existing = (data ?? []) as VenueRow[];
  console.log(`Database holds ${existing.length} venue(s) in ${cities.join(", ")}.\n`);

  const plan = buildPlan(discovered, existing, areasOnly);
  printPlan(plan, areasOnly);

  if (dryRun) {
    console.log("\n--dry-run: nothing was written.");
    return;
  }

  if (!plan.updates.length && !plan.inserts.length) {
    console.log("\nNothing to do.");
    return;
  }

  await applyPlan(db, plan);
}

function buildPlan(discovered: DiscoveredVenue[], existing: VenueRow[], areasOnly: boolean): Plan {
  const byCid = new Map<string, VenueRow>();
  const byName = new Map<string, VenueRow>();
  const byPostcodeName = new Map<string, VenueRow>();

  for (const row of existing) {
    // Test fixtures must never be matched or overwritten by discovery.
    if (row.is_test) continue;
    const cid = cidFrom(row.data_sources);
    if (cid) byCid.set(cid, row);
    byName.set(`${row.city}|${nameKey(row.name)}`, row);
    if (row.postcode) byPostcodeName.set(`${normalisePostcode(row.postcode)}|${nameKey(row.name)}`, row);
  }

  const plan: Plan = { updates: [], inserts: [], unchanged: 0, orphans: [] };
  const matchedRowIds = new Set<string>();

  for (const venue of discovered) {
    const cid = cidFrom(venue.dataSources as Record<string, unknown>);
    let row: VenueRow | undefined;
    let matchedBy = "";

    if (cid && byCid.has(cid)) {
      row = byCid.get(cid);
      matchedBy = "google cid";
    } else if (byName.has(`${venue.city}|${nameKey(venue.name)}`)) {
      row = byName.get(`${venue.city}|${nameKey(venue.name)}`);
      matchedBy = "name + city";
    } else if (venue.postcode && byPostcodeName.has(`${normalisePostcode(venue.postcode)}|${nameKey(venue.name)}`)) {
      row = byPostcodeName.get(`${normalisePostcode(venue.postcode)}|${nameKey(venue.name)}`);
      matchedBy = "postcode + name";
    }

    if (!row) {
      plan.inserts.push(venue);
      continue;
    }

    matchedRowIds.add(row.id);
    const changes = diffColumns(row, venue, areasOnly);
    if (Object.keys(changes).length === 0) {
      plan.unchanged += 1;
      continue;
    }
    plan.updates.push({ row, venue, changes, matchedBy });
  }

  plan.orphans = existing.filter((row) => !row.is_test && !matchedRowIds.has(row.id));
  return plan;
}

/** Only the discovery-owned columns, and only where the value actually differs. */
function diffColumns(row: VenueRow, venue: DiscoveredVenue, areasOnly: boolean): Record<string, unknown> {
  const mapped = toDiscoveryColumns(venue);
  const columns = areasOnly ? (["area"] as const) : DISCOVERY_OWNED_COLUMNS;
  const changes: Record<string, unknown> = {};

  // Area is only worth rewriting when the stored one is unusable. The discovery value can be
  // wrong in the other direction — a venue found through the "Soho" query but actually in
  // Fitzrovia or Mayfair — so replacing a good area with another guess loses information.
  const storedArea = typeof row.area === "string" ? row.area : "";
  const keepStoredArea = storedArea !== "" && !isUnusableArea(storedArea, row.city ?? "");

  for (const column of columns) {
    if (column === "area" && keepStoredArea) continue;
    const next = mapped[column];
    if (next === undefined || next === null || next === "") continue;
    // Coordinates round-trip through JSON with float noise (51.4951567 vs 51.495156699999995),
    // which is the same point to ~1cm. Comparing at 6dp keeps those out of the plan.
    if (column === "latitude" || column === "longitude") {
      if (sameCoordinate(row[column], next)) continue;
    } else if (isEqual(row[column], next)) {
      continue;
    }
    changes[column] = next;
  }

  if (!areasOnly) {
    for (const column of FILL_IF_EMPTY_COLUMNS) {
      const current = row[column];
      const isEmpty = current === null || current === undefined || (Array.isArray(current) && current.length === 0);
      if (isEmpty && mapped[column] != null) changes[column] = mapped[column];
    }

    // Merge data_sources rather than replacing it: the photo backfill records photoSource,
    // photoAttribution and photoBackfilledAt there and must not lose them.
    const mergedSources = { ...(row.data_sources ?? {}), ...((venue.dataSources as object) ?? {}) };
    if (!isEqual(row.data_sources, mergedSources)) changes.data_sources = mergedSources;
  }

  return changes;
}

function toDiscoveryColumns(venue: DiscoveredVenue): Record<string, unknown> {
  return {
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    website: venue.website,
    phone: venue.phone,
    opening_hours: venue.openingHours,
    open_late: venue.openLate,
    business_status: venue.businessStatus,
    food: venue.food,
    alcohol: venue.alcohol,
    outdoor: venue.outdoor,
    primary_category: venue.primaryCategory,
    secondary_categories: venue.secondaryCategories,
  };
}

/** A new venue's full row. Inserts may set everything, since there is nothing to protect. */
function toInsertRow(venue: DiscoveredVenue) {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    description: venue.description,
    country: venue.country ?? "United Kingdom",
    city: venue.city,
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    rating: null,
    price_from: venue.priceFrom ?? null,
    price_level: venue.priceLevel ?? 2,
    primary_category: venue.primaryCategory ?? "shisha_lounge",
    secondary_categories: venue.secondaryCategories ?? ["shisha"],
    indoor: venue.indoor ?? true,
    outdoor: venue.outdoor ?? false,
    food: venue.food ?? false,
    alcohol: venue.alcohol ?? false,
    halal: venue.halal ?? false,
    open_late: venue.openLate ?? false,
    vibes: venue.vibes ?? [],
    images: venue.images ?? [],
    opening_hours: venue.openingHours ?? [],
    website: venue.website ?? null,
    instagram: venue.instagram ?? null,
    phone: venue.phone ?? null,
    business_status: venue.businessStatus ?? "unknown",
    verification_status: venue.verificationStatus ?? "partially-verified",
    last_verified_at: venue.lastVerifiedAt ?? new Date().toISOString(),
    data_sources: venue.dataSources ?? {},
    source_notes: venue.sourceNotes ?? null,
    updated_at: new Date().toISOString(),
  };
}

function printPlan(plan: Plan, areasOnly: boolean) {
  console.log(`Plan${areasOnly ? " (--apply-areas-only: area column only)" : ""}:`);
  console.log(`  update ${plan.updates.length} existing row(s)`);
  console.log(`  insert ${plan.inserts.length} new venue(s)`);
  console.log(`  ${plan.unchanged} already up to date`);
  console.log(`  ${plan.orphans.length} existing row(s) matched nothing in this file (left untouched)`);

  if (plan.updates.length) {
    console.log(`\n--- updates ---`);
    for (const { row, changes, matchedBy } of plan.updates) {
      const fields = Object.keys(changes);
      console.log(`  ${row.slug}  [${matchedBy}]`);
      for (const field of fields.slice(0, 6)) {
        console.log(`      ${field}: ${short(row[field])} -> ${short(changes[field])}`);
      }
      if (fields.length > 6) console.log(`      ...and ${fields.length - 6} more field(s)`);
    }
  }

  if (plan.inserts.length) {
    console.log(`\n--- inserts ---`);
    for (const venue of plan.inserts.slice(0, 25)) {
      console.log(`  ${venue.slug}  (${venue.area}) ${venue.address.slice(0, 44)}`);
    }
    if (plan.inserts.length > 25) console.log(`  ...and ${plan.inserts.length - 25} more`);
  }

  if (plan.orphans.length) {
    console.log(`\n--- existing rows not in this file ---`);
    console.log(`  These keep their current data. Review them: a venue that has really closed`);
    console.log(`  should be set to permanently-closed by hand rather than deleted, so its`);
    console.log(`  booking history and any owner claim survive.`);
    for (const row of plan.orphans.slice(0, 20)) {
      console.log(`  ${row.slug}  (area: ${row.area ?? "-"}, images: ${row.images?.length ?? 0})`);
    }
    if (plan.orphans.length > 20) console.log(`  ...and ${plan.orphans.length - 20} more`);
  }

  const wouldBlankImages = plan.updates.filter(({ row, changes }) => "images" in changes && (row.images?.length ?? 0) > 0);
  console.log(`\nSafety checks:`);
  console.log(`  images column touched: ${wouldBlankImages.length ? "YES — BUG" : "no (photo backfill data is safe)"}`);
  console.log(`  price_from / instagram / description touched: ${plan.updates.some(({ changes }) => "price_from" in changes || "instagram" in changes || "description" in changes) ? "YES — BUG" : "no"}`);
  console.log(`  claim / monetisation columns touched: ${plan.updates.some(({ changes }) => Object.keys(changes).some((key) => /claim|monetisation|partner|featured/.test(key))) ? "YES — BUG" : "no"}`);
  console.log(`  rows deleted: no (this script never deletes)`);
}

async function applyPlan(db: ReturnType<typeof createDbClient>, plan: Plan) {
  console.log("");
  let updated = 0;
  for (const { row, changes } of plan.updates) {
    const { error } = await db
      .from("venues")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(`Update failed for ${row.slug}: ${error.message}`);
    updated += 1;
  }
  if (updated) console.log(`Updated ${updated} row(s).`);

  if (plan.inserts.length) {
    const rows = plan.inserts.map(toInsertRow);
    const { error } = await db.from("venues").insert(rows);
    if (error) throw new Error(`Insert failed: ${error.message}`);
    console.log(`Inserted ${rows.length} row(s).`);
  }

  console.log("\nDone. Run the photo backfill for the new venues:");
  console.log("  npx tsx scripts/backfill-venue-photos.ts --dry-run");
}

function createDbClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The `cid` in a Google Maps URI identifies the place and survives renames and moves. */
function cidFrom(dataSources: Record<string, unknown> | null | undefined) {
  const uri = String((dataSources as Record<string, string> | null)?.otherSource ?? "");
  return uri.match(/[?&]cid=(\d+)/)?.[1] ?? null;
}

/**
 * True for a stored area that is not a real neighbourhood: empty, the city itself, a street
 * line, or an address fragment. These are the ones worth replacing.
 */
function isUnusableArea(area: string, cityName: string) {
  const trimmed = area.trim();
  if (!trimmed) return true;
  if (trimmed.toLowerCase() === cityName.trim().toLowerCase()) return true;
  if (/^\d/.test(trimmed)) return true;
  if (isAddressFragment(trimmed)) return true;
  const last = trimmed.split(/\s+/).pop()?.toLowerCase().replace(/\.$/, "") ?? "";
  return STREET_SUFFIXES.has(last);
}

/**
 * Google occasionally returns a piece of the address line as a locality component, e.g.
 * "Rear of" from "Dune lounge, Rear of, 204 Lea Bridge Rd". These read as areas but are not.
 */
function isAddressFragment(value: string) {
  return /^(rear of|front of|unit|flat|suite|floor|basement|ground floor|opposite|next to|behind|above|below|c\/o)\b/i.test(value.trim());
}

const STREET_SUFFIXES = new Set([
  "st", "street", "rd", "road", "ave", "avenue", "ln", "lane", "way", "close", "cl",
  "dr", "drive", "pl", "place", "sq", "square", "row", "parade", "broadway", "walk",
  "crescent", "cres", "grove", "mews", "embankment", "bridge",
]);

function nameKey(name: string) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalisePostcode(postcode: string) {
  return postcode.toUpperCase().replace(/\s+/g, "");
}

/** True when two coordinates agree to 6 decimal places (about 0.1m). */
function sameCoordinate(a: unknown, b: unknown) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return Math.abs(left - right) < 1e-6;
}

function isEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function short(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text == null) return "null";
  return text.length > 44 ? `${text.slice(0, 44)}...` : text;
}

function printHelp() {
  console.log(`Reconcile a discovery file against the venues already in Supabase.

Updates only the columns discovery owns, and never touches images, pricing, descriptions,
owner claims or monetisation state. Never deletes a row.

Usage:
  npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json --dry-run
  npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json
  npx tsx scripts/reconcile-venues.ts data/venues/london.generated.json --apply-areas-only

Options:
  --dry-run             Print the plan and exit without writing.
  --apply-areas-only    Update the area column only. Useful for landing an area fix alone.

Required env:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
