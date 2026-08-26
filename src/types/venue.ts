import type { MonetisationStatus, PartnerTier } from "@/types/monetisation";

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
export type BusinessStatus = "open" | "temporarily-closed" | "permanently-closed" | "unknown";
export type VerificationStatus = "unverified" | "partially-verified" | "verified";

export interface VenueDataSources {
  officialWebsite?: string;
  officialLinktree?: string;
  venueHostWebsite?: string;
  venueHostAddressSource?: string;
  bookingUrl?: string;
  bookingSource?: string;
  contactUrl?: string;
  menuUrl?: string;
  shishaMenuUrl?: string;
  shishaPageUrl?: string;
  instagram?: string;
  directorySource?: string;
  companiesHouseSource?: string;
  foodHygieneSource?: string;
  tripadvisorSource?: string;
  westfieldSource?: string;
  otherSource?: string;
}

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
  country: string;
  city: string;
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  priceFrom?: number | null;
  priceLevel: PriceLevel;
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  openLate: boolean;
  vibes: VenueVibe[];
  images: string[];
  openingHours: OpeningHours[];
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
  businessStatus: BusinessStatus;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string | null;
  dataSources: VenueDataSources;
  sourceNotes?: string | null;
  isClaimed: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
  partnerTier: PartnerTier;
  monetisationStatus: MonetisationStatus;
  monetisationNotes: string | null;
  featuredEligible: boolean;
  featuredBlockedReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
