/// <reference types="node" />

import sharp, { type Metadata, type Sharp } from "sharp";

/**
 * Website scraping pulls in more than photography: header wordmarks, blank spacer images and
 * small promo banners all sit in the same markup as the real interior shots. Filenames do not
 * tell them apart reliably (a wordmark is rarely called "logo.png"), so we look at the pixels.
 */

export type PhotoVerdict =
  | { kind: "photo"; width: number; height: number; heroWorthy: boolean }
  | { kind: "wordmark" | "blank" | "too-small" | "unreadable"; reason: string };

/** Below this, an image is a header logo or UI sprite rather than venue photography. */
const MIN_DIMENSION = 280;
const MIN_PIXELS = 100_000;
/** Photos at least this large are good enough to lead a venue page. */
const HERO_MIN_DIMENSION = 700;
/** A photo of a room practically never exceeds this; banners and wordmarks do. */
const MAX_ASPECT_RATIO = 2.6;
/** Share of pixels allowed to sit in the single most common colour bucket. */
const MAX_FLAT_COLOUR_SHARE = 0.72;
/** Wordmarks are mostly transparent, with the lettering making up the rest. */
const MAX_TRANSPARENT_SHARE = 0.35;
const MIN_COLOUR_BUCKETS = 24;
const MIN_SATURATION_SPREAD = 0.06;

export async function classifyPhoto(buffer: Buffer): Promise<PhotoVerdict> {
  let image: Sharp;
  let metadata: Metadata;

  try {
    image = sharp(buffer, { failOn: "none" });
    metadata = await image.metadata();
  } catch (error) {
    return { kind: "unreadable", reason: error instanceof Error ? error.message : "sharp failed" };
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return { kind: "unreadable", reason: "no dimensions" };
  }

  if (Math.min(width, height) < MIN_DIMENSION || width * height < MIN_PIXELS) {
    return { kind: "too-small", reason: `${width}x${height}` };
  }

  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  if (aspectRatio > MAX_ASPECT_RATIO) {
    return { kind: "wordmark", reason: `aspect ratio ${aspectRatio.toFixed(1)}` };
  }

  /**
   * A transparent background is the clearest wordmark tell: photographs are never transparent,
   * and a logo exported as PNG usually is.
   */
  if (metadata.hasAlpha) {
    const alphaStats = await sharp(buffer, { failOn: "none" }).ensureAlpha().extractChannel(3).stats();
    const meanAlpha = alphaStats.channels[0].mean / 255;
    if (1 - meanAlpha > MAX_TRANSPARENT_SHARE) {
      return { kind: "wordmark", reason: `${Math.round((1 - meanAlpha) * 100)}% transparent` };
    }
  }

  // Downsample before counting colours: we want the broad palette, not sensor noise.
  const sampleSize = 64;
  let pixels: Buffer;

  try {
    pixels = await sharp(buffer, { failOn: "none" })
      .flatten({ background: "#ffffff" })
      .resize(sampleSize, sampleSize, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();
  } catch (error) {
    return { kind: "unreadable", reason: error instanceof Error ? error.message : "resize failed" };
  }

  const buckets = new Map<number, number>();
  let saturationMin = 1;
  let saturationMax = 0;

  for (let offset = 0; offset < pixels.length; offset += 3) {
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];

    // 5 bits per channel: close shades collapse together, distinct colours stay apart.
    const bucket = ((red >> 3) << 10) | ((green >> 3) << 5) | (blue >> 3);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const saturation = max === 0 ? 0 : (max - min) / max;
    saturationMin = Math.min(saturationMin, saturation);
    saturationMax = Math.max(saturationMax, saturation);
  }

  const totalSamples = pixels.length / 3;
  const dominantShare = Math.max(...buckets.values()) / totalSamples;

  if (dominantShare > MAX_FLAT_COLOUR_SHARE) {
    return { kind: "blank", reason: `${Math.round(dominantShare * 100)}% one colour` };
  }

  if (buckets.size < MIN_COLOUR_BUCKETS && saturationMax - saturationMin < MIN_SATURATION_SPREAD) {
    return { kind: "wordmark", reason: `${buckets.size} colour buckets, flat saturation` };
  }

  return { kind: "photo", width, height, heroWorthy: Math.min(width, height) >= HERO_MIN_DIMENSION };
}
