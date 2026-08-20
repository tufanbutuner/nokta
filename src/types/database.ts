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
  price_from: number;
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
  created_at: string;
  updated_at: string;
}
