export interface VenueRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  area: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  price_from: number | null;
  price_level: 1 | 2 | 3 | 4;
  indoor: boolean;
  outdoor: boolean;
  food: boolean;
  alcohol: boolean;
  open_late: boolean;
  vibes: string[];
  images: string[];
  opening_hours: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  business_status: "open" | "temporarily-closed" | "permanently-closed" | "unknown";
  verification_status: "unverified" | "partially-verified" | "verified";
  last_verified_at: string | null;
  data_sources: Record<string, string>;
  source_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VenueRowInput = Omit<VenueRow, "created_at" | "updated_at">;

export interface VenueReviewRow {
  id: string;
  venue_id: string;
  user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  body: string;
  visit_date: string | null;
  created_at: string;
  updated_at: string;
}
