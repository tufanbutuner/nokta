import type { Venue } from "@/types/venue";

export const VENUE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85";

const VENUE_GALLERY_FALLBACKS = [
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=85",
];

export function getVenueImage(venue: Venue) {
  return venue.images[0] ?? VENUE_IMAGE_FALLBACK;
}

export function getVenueImages(venue: Venue, minimumCount = 5) {
  const realImages = venue.images.length ? venue.images : [VENUE_IMAGE_FALLBACK];
  const uniqueImages = [...new Set(realImages)];

  for (const image of VENUE_GALLERY_FALLBACKS) {
    if (uniqueImages.length >= minimumCount) {
      break;
    }

    if (!uniqueImages.includes(image)) {
      uniqueImages.push(image);
    }
  }

  return uniqueImages;
}
