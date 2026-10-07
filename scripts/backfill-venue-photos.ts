/// <reference types="node" />

/**
 * Replaces the seeded stock photos on venues with real ones.
 *
 * Two sources, in order of preference:
 *   1. The venue's own website (og:image, twitter:image, JSON-LD image, then gallery <img> tags).
 *      These are the venue's own marketing shots and carry no third-party terms.
 *   2. Google Places photos, which we re-host so that pages do not depend on Google CDN links
 *      that expire. Attribution is stored alongside so the venue page can credit the author.
 *
 * Everything is copied into the public `venue-media` bucket, so the site serves its own URLs.
 * Venues we find nothing for are left with an empty `images` array on purpose: the UI shows a
 * branded monogram tile, which is honest, rather than a stock lounge that is not the venue.
 *
 * Usage:
 *   npx tsx scripts/backfill-venue-photos.ts --dry-run
 *   npx tsx scripts/backfill-venue-photos.ts --limit 10
 *   npx tsx scripts/backfill-venue-photos.ts --venue some-venue-slug
 *   npx tsx scripts/backfill-venue-photos.ts --force        (re-run venues that already have real photos)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import crypto from "node:crypto";
import { classifyPhoto } from "./lib/venuePhotoQuality";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.photos";
const STORAGE_BUCKET = "venue-media";
const STORAGE_PREFIX = "backfill";
const TARGET_PHOTO_COUNT = 5;
const PHOTO_MAX_WIDTH = 1600;
const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const REQUEST_DELAY_MS = 350;
const USER_AGENT = "NoktaVenuePhotoBackfill/1.0 (+https://nokta.co.uk)";
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Sprites, logos and social badges that are never a photo of the venue. */
const IMAGE_URL_DENYLIST = /logo|sprite|icon|favicon|badge|placeholder|avatar|pixel|banner-ad|tripadvisor|facebook|instagram-glyph|whatsapp|deliveroo|ubereats|justeat|google-?play|app-?store/i;

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  images: string[];
  website: string | null;
  data_sources: Record<string, unknown> | null;
  is_test: boolean;
};

type FoundPhoto = {
  url: string;
  source: "website" | "google-places";
  attribution?: string;
};

type GradedPhoto = {
  candidate: FoundPhoto;
  image: { buffer: Buffer; contentType: string; extension: string };
  isWordmark: boolean;
  heroWorthy: boolean;
  pixels: number;
};

type Options = {
  dryRun: boolean;
  force: boolean;
  limit: number | null;
  venue: string | null;
};

function parseOptions(argv: string[]): Options {
  const options: Options = { dryRun: false, force: false, limit: null, venue: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--limit") options.limit = Number(argv[++index]);
    else if (arg === "--venue") options.venue = argv[++index] ?? null;
  }

  return options;
}

function isStockImage(url: string) {
  return url.includes("images.unsplash.com") || url.includes("images.pexels.com");
}

/** Google's own CDN links expire, so a venue on one still counts as needing a re-host. */
function isExpiringGoogleImage(url: string) {
  return url.includes("googleusercontent.com") || url.includes("maps.googleapis.com");
}

function needsPhotos(venue: VenueRow, force: boolean) {
  if (force) return true;
  const images = venue.images ?? [];
  if (!images.length) return true;
  return images.every((url) => isStockImage(url) || isExpiringGoogleImage(url));
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, ...(init?.headers ?? {}) },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveUrl(candidate: string, baseUrl: string) {
  try {
    const url = new URL(candidate, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function extractMetaImages(html: string, baseUrl: string) {
  const found: string[] = [];
  const metaPattern = /<meta\b[^>]*>/gi;

  for (const [tag] of html.matchAll(metaPattern)) {
    const property = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (property !== "og:image" && property !== "og:image:secure_url" && property !== "twitter:image") {
      continue;
    }

    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const resolved = content ? resolveUrl(content.trim(), baseUrl) : null;
    if (resolved) found.push(resolved);
  }

  return found;
}

function extractJsonLdImages(html: string, baseUrl: string) {
  const found: string[] = [];
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const [, body] of html.matchAll(scriptPattern)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.trim());
    } catch {
      continue;
    }

    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) {
        stack.push(...node);
        continue;
      }
      if (!node || typeof node !== "object") continue;

      const record = node as Record<string, unknown>;
      const image = record.image;
      const candidates = Array.isArray(image) ? image : [image];

      for (const candidate of candidates) {
        const value =
          typeof candidate === "string"
            ? candidate
            : candidate && typeof candidate === "object"
              ? (candidate as Record<string, unknown>).url
              : null;
        const resolved = typeof value === "string" ? resolveUrl(value, baseUrl) : null;
        if (resolved) found.push(resolved);
      }

      stack.push(...Object.values(record));
    }
  }

  return found;
}

function extractGalleryImages(html: string, baseUrl: string) {
  const found: string[] = [];
  const imgPattern = /<img\b[^>]*>/gi;

  for (const [tag] of html.matchAll(imgPattern)) {
    const src =
      /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ??
      /\bdata-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!src || src.startsWith("data:")) continue;

    const resolved = resolveUrl(src.trim(), baseUrl);
    if (resolved) found.push(resolved);
  }

  return found;
}

async function findWebsitePhotos(venue: VenueRow): Promise<FoundPhoto[]> {
  if (!venue.website) return [];

  let html: string;
  let finalUrl = venue.website;

  try {
    const response = await fetchWithTimeout(venue.website);
    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return [];

    finalUrl = response.url || venue.website;
    html = await response.text();
  } catch {
    return [];
  }

  const ordered = [
    ...extractMetaImages(html, finalUrl),
    ...extractJsonLdImages(html, finalUrl),
    ...extractGalleryImages(html, finalUrl),
  ];

  const unique: FoundPhoto[] = [];
  const seen = new Set<string>();

  for (const url of ordered) {
    if (seen.has(url) || IMAGE_URL_DENYLIST.test(url)) continue;
    seen.add(url);
    unique.push({ url, source: "website" });
    if (unique.length >= TARGET_PHOTO_COUNT) break;
  }

  return unique;
}

async function findPlacesPhotos(venue: VenueRow, apiKey: string): Promise<FoundPhoto[]> {
  // Once the photo quota is gone, every further search spends a Text Search call for photos
  // we cannot download. Stop asking.
  if (placesQuotaExhausted) return [];

  let payload: { places?: Array<{ photos?: Array<{ name?: string; authorAttributions?: Array<{ displayName?: string }> }> }> };

  try {
    const response = await fetchWithTimeout(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
        "x-goog-fieldmask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: `${venue.name}, ${venue.address}`, maxResultCount: 1 }),
    });

    if (!response.ok) {
      console.warn(`  places search failed (${response.status}) for ${venue.slug}`);
      return [];
    }

    payload = await response.json();
  } catch (error) {
    console.warn(`  places search errored for ${venue.slug}:`, error instanceof Error ? error.message : error);
    return [];
  }

  const photos = payload.places?.[0]?.photos ?? [];

  return photos.slice(0, TARGET_PHOTO_COUNT).flatMap((photo) => {
    if (!photo.name) return [];
    const attribution = photo.authorAttributions?.[0]?.displayName;
    return [
      {
        url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&key=${apiKey}`,
        source: "google-places" as const,
        attribution,
      },
    ];
  });
}

/** Set once a Places quota refuses a download, so the run can stop instead of grinding on. */
let placesQuotaExhausted = false;

async function downloadImage(url: string) {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      // A 429 from the photo-media endpoint is the daily or monthly Places quota, not a
      // missing image. Treating it as "no photos found" hid a quota stop behind a result
      // that looks like the venue simply has no imagery, which is a very different thing.
      if (response.status === 429 && url.includes("places.googleapis.com")) {
        if (!placesQuotaExhausted) {
          console.warn("\n  !! Google Places photo quota exhausted — remaining venues will be skipped.");
          console.warn("     Check the per-day limit at console.cloud.google.com/google/maps-apis/quotas\n");
        }
        placesQuotaExhausted = true;
      }
      return null;
    }

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const extension = ALLOWED_CONTENT_TYPES[contentType];
    if (!extension) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    // Tiny files are tracking pixels or spacer gifs rather than venue photography.
    if (buffer.byteLength < 12000 || buffer.byteLength > MAX_BYTES) return null;

    return { buffer, contentType, extension };
  } catch {
    // A slow or dead image host should cost us that one photo, not the whole run.
    return null;
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }
  if (!placesApiKey) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in .env.local.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  /** Downloads each candidate and keeps the ones whose pixels look like venue photography. */
  async function gradeCandidates(candidates: FoundPhoto[]) {
    const graded: GradedPhoto[] = [];

    for (const candidate of candidates) {
      if (graded.length >= TARGET_PHOTO_COUNT * 2) break;

      const image = await downloadImage(candidate.url);
      if (!image) continue;

      const verdict = await classifyPhoto(image.buffer);

      if (verdict.kind === "unreadable" || verdict.kind === "too-small" || verdict.kind === "blank") {
        console.log(`  skipped ${verdict.kind} image (${verdict.reason})`);
        continue;
      }

      graded.push({
        candidate,
        image,
        isWordmark: verdict.kind === "wordmark",
        heroWorthy: verdict.kind === "photo" && verdict.heroWorthy,
        pixels: verdict.kind === "photo" ? verdict.width * verdict.height : 0,
      });
    }

    return graded;
  }

  /**
   * A venue we found nothing for must still lose its seeded stock photos, otherwise the site
   * keeps showing a lounge that is not this venue. Clearing `images` hands it to the branded
   * placeholder instead.
   */
  async function clearStockImages(venue: VenueRow, dryRun: boolean) {
    const stockImages = (venue.images ?? []).filter((url) => isStockImage(url) || isExpiringGoogleImage(url));
    if (!stockImages.length) return;

    if (dryRun) {
      console.log(`  would clear ${stockImages.length} stock photo(s)`);
      return;
    }

    const { error: clearError } = await supabase
      .from("venues")
      .update({ images: [] as string[], updated_at: new Date().toISOString() })
      .eq("id", venue.id);

    if (clearError) console.warn(`  failed to clear stock photos: ${clearError.message}`);
    else console.log(`  cleared ${stockImages.length} stock photo(s)`);
  }

  const { data, error } = await supabase
    .from("venues")
    .select("id,slug,name,city,address,images,website,data_sources,is_test")
    .order("city")
    .order("name");

  if (error) throw error;

  let queue = (data as VenueRow[]).filter((venue) => !venue.is_test && needsPhotos(venue, options.force));
  if (options.venue) queue = queue.filter((venue) => venue.slug === options.venue || venue.id === options.venue);
  if (options.limit) queue = queue.slice(0, options.limit);

  console.log(`${queue.length} venue(s) to backfill${options.dryRun ? " (dry run)" : ""}.\n`);

  const summary = { updated: 0, skipped: 0, fromWebsite: 0, fromPlaces: 0 };

  for (const [index, venue] of queue.entries()) {
    console.log(`[${index + 1}/${queue.length}] ${venue.name} — ${venue.city}`);

    const candidates = await findWebsitePhotos(venue);

    /**
     * Download and look at every candidate before picking: scraped pages mix real photography
     * with header wordmarks and blank spacers, and we only find that out from the pixels.
     */
    const graded = await gradeCandidates(candidates);

    /**
     * Only real photographs count towards the threshold. A site that serves nothing but its
     * logo would otherwise leave the venue with a wordmark where its hero shot belongs, so we
     * top up from Places whenever the website did not yield enough actual photos.
     */
    if (graded.filter((entry) => !entry.isWordmark).length < 3) {
      const placesPhotos = await findPlacesPhotos(venue, placesApiKey);
      graded.push(...(await gradeCandidates(placesPhotos)));
    }

    if (!graded.length) {
      console.log("  no photos found, falling back to the branded placeholder");
      await clearStockImages(venue, options.dryRun);
      summary.skipped += 1;
      continue;
    }

    /**
     * Real photography leads, and a wordmark only ever trails the gallery, so a venue never
     * shows its logo where a picture of the room should be.
     */
    const ranked = graded
      .sort((left, right) => {
        if (left.isWordmark !== right.isWordmark) return left.isWordmark ? 1 : -1;
        if (left.heroWorthy !== right.heroWorthy) return left.heroWorthy ? -1 : 1;
        return right.pixels - left.pixels;
      })
      .slice(0, TARGET_PHOTO_COUNT);

    const wordmarkCount = ranked.filter((entry) => entry.isWordmark).length;
    if (wordmarkCount) console.log(`  ${wordmarkCount} wordmark(s) moved to the end of the gallery`);

    const uploadedUrls: string[] = [];
    const attributions: string[] = [];
    let usedWebsite = false;
    let usedPlaces = false;

    for (const { candidate, image } of ranked) {
      const digest = crypto.createHash("sha1").update(image.buffer).digest("hex").slice(0, 12);
      const storagePath = `${STORAGE_PREFIX}/${venue.id}/${digest}.${image.extension}`;

      if (options.dryRun) {
        console.log(`  would upload ${candidate.source} photo -> ${storagePath}`);
      } else {
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, image.buffer, { contentType: image.contentType, upsert: true, cacheControl: "31536000" });

        if (uploadError) {
          console.warn(`  upload failed: ${uploadError.message}`);
          continue;
        }
      }

      uploadedUrls.push(supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl);
      if (candidate.source === "website") usedWebsite = true;
      if (candidate.source === "google-places") {
        usedPlaces = true;
        if (candidate.attribution) attributions.push(candidate.attribution);
      }
    }

    if (!uploadedUrls.length) {
      console.log("  no usable photos downloaded, falling back to the branded placeholder");
      await clearStockImages(venue, options.dryRun);
      summary.skipped += 1;
      continue;
    }

    if (usedWebsite) summary.fromWebsite += 1;
    if (usedPlaces) summary.fromPlaces += 1;

    const photoSources: string[] = [];
    if (usedWebsite) photoSources.push("venue website");
    if (usedPlaces) photoSources.push("Google Places photos");

    const dataSources = {
      ...(venue.data_sources ?? {}),
      photoSource: photoSources.join(" + "),
      photoAttribution: [...new Set(attributions)].join(", ") || undefined,
      photoBackfilledAt: new Date().toISOString(),
    };

    if (options.dryRun) {
      console.log(`  would set ${uploadedUrls.length} photo(s) from ${photoSources.join(" + ")}`);
      summary.updated += 1;
    } else {
      const { error: updateError } = await supabase
        .from("venues")
        .update({ images: uploadedUrls, data_sources: dataSources, updated_at: new Date().toISOString() })
        .eq("id", venue.id);

      if (updateError) {
        console.warn(`  update failed: ${updateError.message}`);
        summary.skipped += 1;
      } else {
        console.log(`  saved ${uploadedUrls.length} photo(s) from ${photoSources.join(" + ")}`);
        summary.updated += 1;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  console.log("\nDone.", summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
