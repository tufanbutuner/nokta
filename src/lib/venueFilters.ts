import type { DiscoverView, FeatureFilterKey, VenueFilterState } from "@/types/filters";
import type { VenueSortOption } from "@/types/sort";
import type { PriceLevel, VenueVibe } from "@/types/venue";

export const INITIAL_VENUE_FILTERS: VenueFilterState = {
  query: "",
  area: "all",
  priceLevel: "all",
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

export function parseVenueFilters(params: URLSearchParams): VenueFilterState {
  const price = Number(params.get("price"));
  const vibes = splitParam(params.get("vibes")).filter((vibe): vibe is VenueVibe => validVibes.has(vibe as VenueVibe));
  const features = splitParam(params.get("features")).filter((feature): feature is FeatureFilterKey =>
    validFeatures.has(feature as FeatureFilterKey),
  );

  return {
    query: params.get("q") ?? "",
    area: params.get("area") || "all",
    priceLevel: isPriceLevel(price) ? price : "all",
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

  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.area !== "all") params.set("area", filters.area);
  if (filters.priceLevel !== "all") params.set("price", String(filters.priceLevel));
  if (filters.vibes.length) params.set("vibes", filters.vibes.join(","));
  if (features.length) params.set("features", features.join(","));

  return params;
}

export function hasActiveFilters(filters: VenueFilterState) {
  return (
    Boolean(filters.query.trim()) ||
    filters.area !== "all" ||
    filters.priceLevel !== "all" ||
    filters.vibes.length > 0 ||
    Object.values(filters.features).some(Boolean)
  );
}

export function parseDiscoverView(params: URLSearchParams): DiscoverView {
  return params.get("view") === "map" ? "map" : "list";
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
