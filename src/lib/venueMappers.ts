import type { VenueRow } from "../types/database";
import type { Venue } from "../types/venue";

export function mapVenueRowToVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    area: row.area,
    address: row.address,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating ?? undefined,
    priceFrom: row.price_from,
    priceLevel: row.price_level,
    indoor: row.indoor,
    outdoor: row.outdoor,
    food: row.food,
    alcohol: row.alcohol,
    openLate: row.open_late,
    vibes: row.vibes as Venue["vibes"],
    images: row.images,
    openingHours: row.opening_hours,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    phone: row.phone ?? undefined,
  };
}

export function mapVenueToVenueRow(venue: Venue): Omit<VenueRow, "created_at" | "updated_at"> {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    description: venue.description,
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    rating: venue.rating ?? null,
    price_from: venue.priceFrom,
    price_level: venue.priceLevel,
    indoor: venue.indoor,
    outdoor: venue.outdoor,
    food: venue.food,
    alcohol: venue.alcohol,
    open_late: venue.openLate,
    vibes: venue.vibes,
    images: venue.images,
    opening_hours: venue.openingHours,
    website: venue.website ?? null,
    instagram: venue.instagram ?? null,
    phone: venue.phone ?? null,
  };
}
