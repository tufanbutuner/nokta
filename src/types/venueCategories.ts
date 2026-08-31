export type VenuePrimaryCategory =
  | "shisha_lounge"
  | "restaurant"
  | "bar"
  | "cafe"
  | "dessert"
  | "lounge"
  | "late_night"
  | "private_hire"
  | "other";

export type VenueSecondaryCategory =
  | "shisha"
  | "food"
  | "mocktails"
  | "cocktails"
  | "coffee"
  | "dessert"
  | "brunch"
  | "late_night"
  | "live_sport"
  | "private_hire"
  | "outdoor_seating"
  | "date_night"
  | "groups"
  | "events";

export interface VenueCategoryConfig {
  id: VenuePrimaryCategory;
  label: string;
  pluralLabel: string;
  description: string;
  isLaunchCategory: boolean;
  isActive: boolean;
}
