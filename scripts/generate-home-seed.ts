import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { selectHomeSeedVenues } from "../src/lib/homeSeed";
import { mapVenueRowToVenue } from "../src/lib/venueMappers";
import type { VenueRow } from "../src/types/database";

config({ path: ".env.local" });
config();

/** Read by the Vite plugin that inlines the seed into index.html. */
const HOME_SEED_PATH = join(process.cwd(), ".generated", "home-seed.json");

/**
 * Unlike the sitemap, a missing seed is harmless: the homepage falls back to waiting
 * for the live list, as it always has. So a Supabase hiccup writes an empty seed and
 * lets the build carry on rather than failing the deploy.
 */
async function main() {
  let seed: ReturnType<typeof selectHomeSeedVenues> = [];
  try {
    seed = selectHomeSeedVenues(await getVenues());
  } catch (error) {
    console.warn(`Home seed skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  await mkdir(dirname(HOME_SEED_PATH), { recursive: true });
  await writeFile(HOME_SEED_PATH, JSON.stringify(seed), "utf8");
  console.log(`Home seed: ${seed.length} venues`);
}

async function getVenues() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("VITE_SUPABASE_URL and a Supabase key are not set.");

  const client = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await client.from("venues").select("*").eq("city", "London");
  if (error) throw new Error(error.message);
  return ((data ?? []) as VenueRow[]).map(mapVenueRowToVenue);
}

void main();
