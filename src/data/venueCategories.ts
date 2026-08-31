import type { VenueCategoryConfig } from "@/types/venueCategories";

export const venueCategories: VenueCategoryConfig[] = [
  { id: "shisha_lounge", label: "Shisha lounge", pluralLabel: "Shisha lounges", description: "Lounges where customers can request bookings and view venue details.", isLaunchCategory: true, isActive: true },
  { id: "restaurant", label: "Restaurant", pluralLabel: "Restaurants", description: "Restaurants and dining venues.", isLaunchCategory: false, isActive: false },
  { id: "bar", label: "Bar", pluralLabel: "Bars", description: "Bars and drinks-led venues.", isLaunchCategory: false, isActive: false },
  { id: "cafe", label: "Cafe", pluralLabel: "Cafes", description: "Cafes and casual daytime venues.", isLaunchCategory: false, isActive: false },
  { id: "dessert", label: "Dessert spot", pluralLabel: "Dessert spots", description: "Dessert, tea and sweet-focused venues.", isLaunchCategory: false, isActive: false },
  { id: "lounge", label: "Lounge", pluralLabel: "Lounges", description: "Social lounge venues.", isLaunchCategory: false, isActive: false },
  { id: "late_night", label: "Late-night venue", pluralLabel: "Late-night venues", description: "Venues suited to evening and late-night plans.", isLaunchCategory: false, isActive: false },
  { id: "private_hire", label: "Private hire venue", pluralLabel: "Private hire venues", description: "Venues suitable for group bookings and private events.", isLaunchCategory: false, isActive: false },
  { id: "other", label: "Venue", pluralLabel: "Venues", description: "Other social venues.", isLaunchCategory: false, isActive: false },
];

export const activeVenueCategories = venueCategories.filter((category) => category.isActive);
