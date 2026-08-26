import type { VenueRowInput } from "@/types/database";
import { DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import type { Venue } from "@/types/venue";
import type { VenueFormValues } from "@/types/venueForm";
import type { VenueSuggestion } from "@/types/venueSuggestions";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function mapVenueToFormValues(venue: Venue): VenueFormValues {
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
    priceFrom: venue.priceFrom ?? null,
    priceLevel: venue.priceLevel,
    indoor: venue.indoor,
    outdoor: venue.outdoor,
    food: venue.food,
    alcohol: venue.alcohol,
    openLate: venue.openLate,
    vibes: venue.vibes,
    images: venue.images,
    openingHours: venue.openingHours.length ? venue.openingHours : createDefaultOpeningHours(),
    website: venue.website ?? null,
    instagram: venue.instagram ?? null,
    phone: venue.phone ?? null,
    businessStatus: venue.businessStatus,
    verificationStatus: venue.verificationStatus,
    lastVerifiedAt: formatDateInputValue(venue.lastVerifiedAt),
    dataSources: Object.fromEntries(Object.entries(venue.dataSources).filter(([, value]) => typeof value === "string")),
    sourceNotes: venue.sourceNotes ?? null,
    isClaimed: venue.isClaimed,
    claimedBy: venue.claimedBy,
    claimedAt: formatDateInputValue(venue.claimedAt),
    partnerTier: venue.partnerTier,
    monetisationStatus: venue.monetisationStatus,
    monetisationNotes: venue.monetisationNotes,
    featuredEligible: venue.featuredEligible,
    featuredBlockedReason: venue.featuredBlockedReason,
  };
}

export function mapFormValuesToVenueRow(values: VenueFormValues): VenueRowInput {
  return {
    id: values.id.trim(),
    slug: values.slug.trim(),
    name: values.name.trim(),
    description: values.description.trim(),
    country: values.country.trim(),
    city: values.city.trim(),
    area: values.area.trim(),
    address: values.address.trim(),
    postcode: values.postcode.trim(),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    rating: values.rating,
    price_from: values.priceFrom,
    price_level: values.priceLevel,
    indoor: values.indoor,
    outdoor: values.outdoor,
    food: values.food,
    alcohol: values.alcohol,
    open_late: values.openLate,
    vibes: values.vibes,
    images: compactStringList(values.images),
    opening_hours: values.openingHours.filter((item) => item.day.trim() && item.open.trim() && item.close.trim()),
    website: nullableString(values.website),
    instagram: nullableString(values.instagram),
    phone: nullableString(values.phone),
    business_status: values.businessStatus,
    verification_status: values.verificationStatus,
    last_verified_at: values.lastVerifiedAt ? new Date(values.lastVerifiedAt).toISOString() : null,
    data_sources: compactDataSources(values.dataSources),
    source_notes: nullableString(values.sourceNotes),
    is_claimed: values.isClaimed,
    claimed_by: values.isClaimed ? nullableString(values.claimedBy) : null,
    claimed_at: values.isClaimed && values.claimedAt ? new Date(values.claimedAt).toISOString() : null,
    partner_tier: values.partnerTier,
    monetisation_status: values.monetisationStatus,
    monetisation_notes: nullableString(values.monetisationNotes),
    featured_eligible: values.featuredEligible,
    featured_blocked_reason: values.featuredEligible ? null : nullableString(values.featuredBlockedReason),
  };
}

export function createEmptyVenueFormValues(): VenueFormValues {
  return {
    id: "",
    slug: "",
    name: "",
    description: "",
    country: DEFAULT_COUNTRY,
    city: DEFAULT_CITY,
    area: "",
    address: "",
    postcode: "",
    latitude: "",
    longitude: "",
    rating: null,
    priceFrom: null,
    priceLevel: 2,
    indoor: true,
    outdoor: false,
    food: false,
    alcohol: false,
    openLate: false,
    vibes: [],
    images: [],
    openingHours: createDefaultOpeningHours(),
    website: null,
    instagram: null,
    phone: null,
    businessStatus: "unknown",
    verificationStatus: "unverified",
    lastVerifiedAt: null,
    dataSources: {},
    sourceNotes: null,
    isClaimed: false,
    claimedBy: null,
    claimedAt: null,
    partnerTier: "none",
    monetisationStatus: "not-contacted",
    monetisationNotes: null,
    featuredEligible: false,
    featuredBlockedReason: null,
  };
}

export function createVenueFormValuesFromSuggestion(suggestion: VenueSuggestion): VenueFormValues {
  const generatedSlug = generateVenueSlug(suggestion.venueName);
  const dataSources: Record<string, string> = {};

  if (suggestion.website) {
    dataSources.officialWebsite = suggestion.website;
  }

  if (suggestion.instagram) {
    dataSources.instagram = suggestion.instagram;
  }

  return {
    ...createEmptyVenueFormValues(),
    id: generatedSlug,
    slug: generatedSlug,
    name: suggestion.venueName,
    description: createSuggestionDescription(suggestion),
    country: suggestion.country,
    city: suggestion.city,
    area: suggestion.area ?? "",
    address: suggestion.address ?? "",
    postcode: suggestion.postcode ?? "",
    website: suggestion.website,
    instagram: suggestion.instagram,
    phone: suggestion.phone,
    dataSources,
    sourceNotes: createSuggestionSourceNotes(suggestion),
  };
}

export function createDefaultOpeningHours() {
  return WEEK_DAYS.map((day) => ({ day, open: "", close: "" }));
}

export function generateVenueSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactDataSources(dataSources: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(dataSources).filter(([, value]) => value.trim().length > 0));
}

function compactStringList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function nullableString(value?: string | null): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function formatDateInputValue(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function createSuggestionDescription(suggestion: VenueSuggestion): string {
  if (suggestion.area) {
    return `${suggestion.venueName} is a suggested sheesha venue in ${suggestion.area}. Review and complete this draft before publishing.`;
  }

  return `${suggestion.venueName} is a suggested sheesha venue. Review and complete this draft before publishing.`;
}

function createSuggestionSourceNotes(suggestion: VenueSuggestion): string {
  const notes = ["Created from a user-submitted venue suggestion."];

  if (suggestion.notes) {
    notes.push(`Suggestion notes: ${suggestion.notes}`);
  }

  return notes.join(" ");
}
