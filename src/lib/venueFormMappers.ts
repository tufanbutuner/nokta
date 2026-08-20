import type { VenueRowInput } from "@/types/database";
import type { Venue } from "@/types/venue";
import type { VenueFormValues } from "@/types/venueForm";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function mapVenueToFormValues(venue: Venue): VenueFormValues {
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
  };
}

export function mapFormValuesToVenueRow(values: VenueFormValues): VenueRowInput {
  return {
    id: values.id.trim(),
    slug: values.slug.trim(),
    name: values.name.trim(),
    description: values.description.trim(),
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
  };
}

export function createEmptyVenueFormValues(): VenueFormValues {
  return {
    id: "",
    slug: "",
    name: "",
    description: "",
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
