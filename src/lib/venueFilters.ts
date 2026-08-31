import type { DiscoverView, FeatureFilterKey, VenueFilterState } from "@/types/filters";
import { venueCategories } from "@/data/venueCategories";
import { DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import type { VenueSortOption } from "@/types/sort";
import type { PriceLevel, VenueVibe } from "@/types/venue";
import type { VenuePrimaryCategory } from "@/types/venueCategories";

export const INITIAL_VENUE_FILTERS: VenueFilterState = {
  query: "",
  country: DEFAULT_COUNTRY,
  city: DEFAULT_CITY,
  area: "all",
  primaryCategories: [],
  priceLevel: "all",
  openNow: false,
  minRating: "all",
  vibes: [],
  features: {
    indoor: false,
    outdoor: false,
    food: false,
    alcohol: false,
    openLate: false,
  },
};

export const PRICE_OPTIONS = [
  { label: "Any price", value: "all" },
  { label: "£", value: "1" },
  { label: "££", value: "2" },
  { label: "£££", value: "3" },
  { label: "££££", value: "4" },
] as const;

export const VIBE_OPTIONS: { label: string; value: VenueVibe }[] = [
  { label: "Casual", value: "casual" },
  { label: "Luxury", value: "luxury" },
  { label: "Date Night", value: "date-night" },
  { label: "Groups", value: "groups" },
  { label: "Football", value: "football" },
  { label: "Late Night", value: "late-night" },
  { label: "Quiet", value: "quiet" },
  { label: "Party", value: "party" },
  { label: "Rooftop", value: "rooftop" },
  { label: "Outdoor", value: "outdoor" },
];

export const FEATURE_OPTIONS: { label: string; value: FeatureFilterKey }[] = [
  { label: "Indoor seating", value: "indoor" },
  { label: "Outdoor seating", value: "outdoor" },
  { label: "Food available", value: "food" },
  { label: "Alcohol", value: "alcohol" },
  { label: "Open late", value: "openLate" },
];

const validVibes = new Set(VIBE_OPTIONS.map((option) => option.value));
const validFeatures = new Set(FEATURE_OPTIONS.map((option) => option.value));
const validPrimaryCategories = new Set(venueCategories.map((category) => category.id));

export function parseVenueFilters(params: URLSearchParams): VenueFilterState {
  const price = Number(params.get("price"));
  const vibes = splitParam(params.get("vibes")).filter((vibe): vibe is VenueVibe => validVibes.has(vibe as VenueVibe));
  const features = splitParam(params.get("features")).filter((feature): feature is FeatureFilterKey =>
    validFeatures.has(feature as FeatureFilterKey),
  );

  return {
    query: params.get("q") ?? "",
    country: params.get("country") || DEFAULT_COUNTRY,
    city: params.get("city") || DEFAULT_CITY,
    area: params.get("area") || "all",
    primaryCategories: parsePrimaryCategories(params.get("category")),
    priceLevel: isPriceLevel(price) ? price : "all",
    openNow: params.get("status") === "open",
    minRating: params.get("rating") === "4" ? 4 : "all",
    vibes,
    features: {
      indoor: features.includes("indoor"),
      outdoor: features.includes("outdoor"),
      food: features.includes("food"),
      alcohol: features.includes("alcohol"),
      openLate: features.includes("openLate"),
    },
  };
}

export function filtersToSearchParams(filters: VenueFilterState) {
  const params = new URLSearchParams();
  const features = FEATURE_OPTIONS.filter((option) => filters.features[option.value]).map((option) => option.value);

  if (filters.query.trim()) params.set("q", filters.query);
  if (filters.country !== DEFAULT_COUNTRY) params.set("country", filters.country);
  if (filters.city !== DEFAULT_CITY) params.set("city", filters.city);
  if (filters.area !== "all") params.set("area", filters.area);
  if (filters.primaryCategories.length) params.set("category", filters.primaryCategories.join(","));
  if (filters.priceLevel !== "all") params.set("price", String(filters.priceLevel));
  if (filters.openNow) params.set("status", "open");
  if (filters.minRating !== "all") params.set("rating", String(filters.minRating));
  if (filters.vibes.length) params.set("vibes", filters.vibes.join(","));
  if (features.length) params.set("features", features.join(","));

  return params;
}

export function hasActiveFilters(filters: VenueFilterState) {
  return (
    Boolean(filters.query.trim()) ||
    filters.country !== DEFAULT_COUNTRY ||
    filters.city !== DEFAULT_CITY ||
    filters.area !== "all" ||
    filters.primaryCategories.length > 0 ||
    filters.priceLevel !== "all" ||
    filters.openNow ||
    filters.minRating !== "all" ||
    filters.vibes.length > 0 ||
    Object.values(filters.features).some(Boolean)
  );
}

export function parseDiscoverView(params: URLSearchParams): DiscoverView {
  return params.get("view") === "list" ? "list" : "map";
}

export function parseVenueSort(params: URLSearchParams): VenueSortOption {
  const sort = params.get("sort");

  if (sort === "rating" || sort === "price-asc" || sort === "price-desc" || sort === "nearest") {
    return sort;
  }

  return "recommended";
}

export function formatPriceLevel(level: number) {
  return "£".repeat(level);
}

export function formatVibe(vibe: string) {
  return vibe
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function splitParam(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

function isPriceLevel(value: number): value is PriceLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function parsePrimaryCategories(value: string | null): VenuePrimaryCategory[] {
  return splitParam(value).filter((category): category is VenuePrimaryCategory => validPrimaryCategories.has(category as VenuePrimaryCategory));
}
