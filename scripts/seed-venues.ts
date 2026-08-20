/// <reference types="node" />

import { createClient } from "@supabase/supabase-js";
import { venues } from "../src/data/venues";
import { mapVenueToVenueRow } from "../src/lib/venueMappers";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to your shell environment before seeding venues.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const rows = venues.map(mapVenueToVenueRow);

const { error } = await supabase.from("venues").upsert(rows, { onConflict: "id" });

if (error) {
  throw new Error(`Could not seed venues: ${error.message}`);
}

console.log(`Seeded ${rows.length} venues.`);
