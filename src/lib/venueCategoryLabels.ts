import { venueCategories } from "@/data/venueCategories";
import type { VenuePrimaryCategory, VenueSecondaryCategory } from "@/types/venueCategories";

const secondaryLabels: Record<VenueSecondaryCategory, string> = {
  shisha: "Shisha",
  food: "Food",
  mocktails: "Mocktails",
  cocktails: "Cocktails",
  coffee: "Coffee",
  dessert: "Dessert",
  brunch: "Brunch",
  late_night: "Late-night",
  live_sport: "Live sport",
  private_hire: "Private hire",
  outdoor_seating: "Outdoor seating",
  date_night: "Date night",
  groups: "Groups",
  events: "Events",
};

export function formatVenuePrimaryCategory(category: VenuePrimaryCategory): string {
  return venueCategories.find((item) => item.id === category)?.label ?? "Venue";
}

export function formatVenuePrimaryCategoryPlural(category: VenuePrimaryCategory): string {
  return venueCategories.find((item) => item.id === category)?.pluralLabel ?? "Venues";
}

export function formatVenueSecondaryCategory(category: VenueSecondaryCategory): string {
  return secondaryLabels[category] ?? "Venue";
}

export function getVenueCategorySeoLabel(category: VenuePrimaryCategory): string {
  return formatVenuePrimaryCategoryPlural(category).toLowerCase();
}
