/// <reference types="node" />

/**
 * Checks every venue in the database against Google's own place type.
 *
 * Discovery matches on names, and a shisha shop, a wholesaler and a delivery service all read
 * like a lounge that way — seventeen reached the directory before `isVisitableVenue` existed.
 * This re-checks what is already seeded, so the ones whose names gave no clue surface too.
 *
 * Read-only by default: it reports and writes a file, and changes nothing without --apply.
 *
 * `--apply` deletes exactly what is in that file rather than re-querying Google. Re-querying
 * would spend the quota twice, ignore any venue removed from the file by hand, and risk
 * deleting a different set from the one that was reviewed.
 *
 * Usage:
 *   npx tsx scripts/audit-venue-types.ts
 *   npx tsx scripts/audit-venue-types.ts --city=London
 *   npx tsx scripts/audit-venue-types.ts --apply
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "node:fs";
import { isVisitableVenue } from "./lib/venueTypes";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = "places.id,places.displayName,places.types,places.primaryType";
const REQUEST_DELAY_MS = 250;
const OUTPUT_PATH = "venue-type-audit.json";

type Row = { id: string; slug: string; name: string; city: string | null; address: string | null };
type Flagged = Row & { primaryType: string | null; types: string[] };

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in .env.local.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");

  const apply = process.argv.includes("--apply");
  const cityArg = process.argv.find((a) => a.startsWith("--city="))?.slice(7);

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // --apply acts on the reviewed file, so review and deletion cannot drift apart.
  if (apply) {
    if (!fs.existsSync(OUTPUT_PATH)) throw new Error(`No ${OUTPUT_PATH} to apply. Run the audit without --apply first.`);
    const reviewed = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) as Flagged[];
    if (!reviewed.length) { console.log(`${OUTPUT_PATH} is empty — nothing to delete.`); return; }
    console.log(`applying ${reviewed.length} venue(s) from ${OUTPUT_PATH} (no Google lookups)\n`);
    await deleteFlagged(db, reviewed);
    return;
  }

  let query = db.from("venues").select("id,slug,name,city,address,is_test,business_status");
  if (cityArg) query = query.eq("city", cityArg);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const venues = (data ?? []).filter((v) => !v.is_test && v.business_status !== "permanently-closed") as Row[];
  console.log(`checking ${venues.length} venue(s) against Google place types...\n`);

  const flagged: Flagged[] = [];
  let checked = 0;
  let unmatched = 0;

  for (const venue of venues) {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
      body: JSON.stringify({ textQuery: `${venue.name}, ${venue.address ?? venue.city}`, regionCode: "GB", maxResultCount: 1 }),
    });

    if (!res.ok) {
      // A quota refusal should stop the run rather than silently skipping the rest, which
      // would read as a clean audit of venues that were never actually checked.
      if (res.status === 429) {
        console.error(`\nGoogle quota exhausted after ${checked} venue(s). Stopping — rerun tomorrow to finish.`);
        break;
      }
      console.warn(`  lookup failed (${res.status}) for ${venue.slug}`);
      continue;
    }

    const payload = (await res.json()) as { places?: Array<{ types?: string[]; primaryType?: string }> };
    const place = payload.places?.[0];
    checked += 1;

    if (!place) { unmatched += 1; continue; }

    if (!isVisitableVenue(place)) {
      flagged.push({ ...venue, primaryType: place.primaryType ?? null, types: place.types ?? [] });
      console.log(`  FLAG  ${String(venue.city).padEnd(14)} ${venue.name.slice(0, 38).padEnd(40)} primary=${place.primaryType ?? "-"}`);
    }

    await wait(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(flagged, null, 2)}\n`);
  console.log(`\nchecked ${checked} venue(s), ${unmatched} not found in Places, ${flagged.length} flagged.`);
  console.log(`written to ${OUTPUT_PATH}`);

  if (!flagged.length) return;

  console.log("\nNothing was changed. Review the file, remove any venue you want to keep, then rerun with --apply.");
}

/** Deletes the reviewed venues, leaving alone any that someone has already interacted with. */
async function deleteFlagged(db: SupabaseClient, flagged: Flagged[]) {
  let deleted = 0;
  for (const venue of flagged) {
    let refs = 0;
    for (const table of ["booking_requests", "venue_menu_items", "promoted_offers", "featured_placements", "venue_enquiries"]) {
      const { count, error: refError } = await db.from(table).select("*", { count: "exact", head: true }).eq("venue_id", venue.id);
      if (!refError) refs += count ?? 0;
    }
    if (refs > 0) { console.log(`  kept ${venue.slug} — ${refs} referencing row(s)`); continue; }

    const { error: deleteError } = await db.from("venues").delete().eq("id", venue.id);
    if (deleteError) { console.error(`  failed ${venue.slug}: ${deleteError.message}`); continue; }
    console.log(`  deleted ${venue.slug}`);
    deleted += 1;
  }
  console.log(`\ndeleted ${deleted} venue(s). Add them to scripts/lib/excludedVenues.ts so discovery cannot re-add them.`);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
