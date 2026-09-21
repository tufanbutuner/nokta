import type { Venue } from "@/types/venue";

/**
 * Warm clay-family gradients for venues we have no photo of. Picked deterministically from the
 * venue id so a venue keeps the same tile between renders and pages.
 */
const VENUE_PLACEHOLDER_GRADIENTS = [
  "from-[#c45d3e] to-[#8a3a25]",
  "from-[#d4956e] to-[#a2543a]",
  "from-[#a2543a] to-[#5f2f20]",
  "from-[#c98a5e] to-[#8c4a30]",
  "from-[#b4674a] to-[#6d3324]",
];

export function getVenueImage(venue: Venue): string | undefined {
  return venue.images[0];
}

export function getVenueImages(venue: Venue) {
  return [...new Set(venue.images)];
}

export function getVenueInitials(venue: Venue) {
  const words = venue.name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => [...word][0])
    .join("");
}

export function getVenuePlaceholderGradient(venue: Venue) {
  let hash = 0;

  for (const character of venue.id) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100000;
  }

  return VENUE_PLACEHOLDER_GRADIENTS[hash % VENUE_PLACEHOLDER_GRADIENTS.length];
}
