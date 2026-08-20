export type VenueVibe =
  | "casual"
  | "luxury"
  | "date-night"
  | "groups"
  | "football"
  | "late-night"
  | "quiet"
  | "party"
  | "rooftop"
  | "outdoor";

export type PriceLevel = 1 | 2 | 3 | 4;

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  description: string;
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating?: number;
  priceFrom: number;
  priceLevel: PriceLevel;
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  openLate: boolean;
  vibes: VenueVibe[];
  images: string[];
  openingHours: OpeningHours[];
  website?: string;
  instagram?: string;
  phone?: string;
}
