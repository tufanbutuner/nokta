import type { VenueRow } from "../types/database";
import type { Venue, VenueDataSources } from "../types/venue";
import { DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import type { MonetisationStatus, PartnerTier } from "@/types/monetisation";
import type { VenuePrimaryCategory, VenueSecondaryCategory } from "@/types/venueCategories";

export function mapVenueRowToVenue(row: VenueRow): Venue {
  const commercialRow = row as Partial<VenueRow>;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    country: row.country ?? DEFAULT_COUNTRY,
    city: row.city ?? DEFAULT_CITY,
    area: row.area,
    address: row.address,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
    priceFrom: row.price_from,
    priceLevel: row.price_level,
    primaryCategory: mapPrimaryCategory(row.primary_category),
    secondaryCategories: mapSecondaryCategories(row.secondary_categories),
    indoor: row.indoor,
    outdoor: row.outdoor,
    food: row.food,
    alcohol: row.alcohol,
    halal: commercialRow.halal ?? false,
    openLate: row.open_late,
    vibes: row.vibes as Venue["vibes"],
    images: row.images,
    openingHours: row.opening_hours,
    website: row.website,
    instagram: row.instagram,
    phone: row.phone,
    businessStatus: row.business_status,
    verificationStatus: row.verification_status,
    lastVerifiedAt: row.last_verified_at,
    dataSources: row.data_sources,
    sourceNotes: row.source_notes,
    isClaimed: commercialRow.is_claimed ?? false,
    claimedBy: commercialRow.claimed_by ?? null,
    claimedAt: commercialRow.claimed_at ?? null,
    partnerTier: (commercialRow.partner_tier ?? "none") as PartnerTier,
    monetisationStatus: (commercialRow.monetisation_status ?? "not-contacted") as MonetisationStatus,
    monetisationNotes: commercialRow.monetisation_notes ?? null,
    featuredEligible: commercialRow.featured_eligible ?? false,
    featuredBlockedReason: commercialRow.featured_blocked_reason ?? null,
    isTest: commercialRow.is_test ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVenueToVenueRow(venue: Venue): Omit<VenueRow, "created_at" | "updated_at"> {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    description: venue.description,
    country: venue.country,
    city: venue.city,
    area: venue.area,
    address: venue.address,
    postcode: venue.postcode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    rating: venue.rating ?? null,
    price_from: venue.priceFrom ?? null,
    price_level: venue.priceLevel,
    primary_category: venue.primaryCategory,
    secondary_categories: venue.secondaryCategories,
    indoor: venue.indoor,
    outdoor: venue.outdoor,
    food: venue.food,
    alcohol: venue.alcohol,
    halal: venue.halal,
    open_late: venue.openLate,
    vibes: venue.vibes,
    images: venue.images,
    opening_hours: venue.openingHours,
    website: venue.website ?? null,
    instagram: venue.instagram ?? null,
    phone: venue.phone ?? null,
    business_status: venue.businessStatus,
    verification_status: venue.verificationStatus,
    last_verified_at: venue.lastVerifiedAt ?? null,
    data_sources: compactDataSources(venue.dataSources),
    source_notes: venue.sourceNotes ?? null,
    is_claimed: venue.isClaimed,
    claimed_by: venue.claimedBy,
    claimed_at: venue.claimedAt,
    partner_tier: venue.partnerTier,
    monetisation_status: venue.monetisationStatus,
    monetisation_notes: venue.monetisationNotes,
    featured_eligible: venue.featuredEligible,
    featured_blocked_reason: venue.featuredBlockedReason,
    is_test: venue.isTest,
  };
}

function mapPrimaryCategory(category?: string | null): VenuePrimaryCategory {
  const allowed: VenuePrimaryCategory[] = ["shisha_lounge", "restaurant", "bar", "cafe", "dessert", "lounge", "late_night", "private_hire", "other"];
  return allowed.includes(category as VenuePrimaryCategory) ? category as VenuePrimaryCategory : "shisha_lounge";
}

function mapSecondaryCategories(categories?: string[] | null): VenueSecondaryCategory[] {
  const allowed = new Set<VenueSecondaryCategory>(["shisha", "food", "mocktails", "cocktails", "coffee", "dessert", "brunch", "late_night", "live_sport", "private_hire", "outdoor_seating", "date_night", "groups", "events"]);
  return (categories ?? []).filter((category): category is VenueSecondaryCategory => allowed.has(category as VenueSecondaryCategory));
}

function compactDataSources(dataSources: VenueDataSources): Record<string, string> {
  return Object.fromEntries(Object.entries(dataSources).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
