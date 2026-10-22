import { describe, expect, it } from "vitest";
import { selectHomeSeedVenues } from "@/lib/homeSeed";
import type { Venue } from "@/types/venue";

function venue(id: string, overrides: Partial<Venue> = {}): Venue {
  return {
    id,
    slug: id,
    name: id,
    description: "A long description",
    country: "United Kingdom",
    city: "London",
    area: "Soho",
    address: "1 Street",
    postcode: "W1",
    latitude: 51.5072,
    longitude: -0.1276,
    priceLevel: 2,
    primaryCategory: "shisha-lounge",
    secondaryCategories: [],
    indoor: true,
    outdoor: false,
    food: false,
    alcohol: false,
    halal: false,
    openLate: false,
    vibes: [],
    images: ["a.jpg", "b.jpg"],
    openingHours: [],
    businessStatus: "open",
    verificationStatus: "verified",
    dataSources: { officialWebsite: "https://example.com" },
    sourceNotes: "notes",
    isClaimed: false,
    claimedBy: null,
    claimedAt: null,
    partnerTier: "none",
    monetisationStatus: "not-contacted",
    monetisationNotes: "notes",
    featuredEligible: false,
    featuredBlockedReason: null,
    isTest: false,
    ...overrides,
  } as Venue;
}

describe("selectHomeSeedVenues", () => {
  it("keeps the nearest London venues to the city centre, nearest first", () => {
    const seed = selectHomeSeedVenues(
      [
        venue("far", { latitude: 51.6 }),
        venue("near", { latitude: 51.508 }),
        venue("middle", { latitude: 51.53 }),
      ],
      2,
    );
    expect(seed.map((item) => item.id)).toEqual(["near", "middle"]);
  });

  it("leaves out other cities, test venues, closed venues and venues without a position", () => {
    const seed = selectHomeSeedVenues([
      venue("kept"),
      venue("birmingham", { city: "Birmingham" }),
      venue("test", { isTest: true }),
      venue("closed", { businessStatus: "permanently-closed" }),
      venue("nowhere", { latitude: Number.NaN }),
    ]);
    expect(seed.map((item) => item.id)).toEqual(["kept"]);
  });

  it("trims each venue to what a card shows", () => {
    const [seeded] = selectHomeSeedVenues([venue("kept")]);
    expect(seeded.images).toEqual(["a.jpg"]);
    expect(seeded.description).toBe("");
    expect(seeded.dataSources).toEqual({});
    expect(seeded.sourceNotes).toBeNull();
    expect(seeded.monetisationNotes).toBeNull();
  });
});
