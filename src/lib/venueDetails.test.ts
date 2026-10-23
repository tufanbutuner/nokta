import { describe, expect, it } from "vitest";
import { buildVenueDetails, getNextLondonDates, type VenueDetailsInput } from "@/lib/venueDetails";
import { NOW, offer, SATURDAY, saturdayAvailability, SITE_URL, venue } from "@/test/venueFixtures";
import type { VenueMenu } from "@/types/venueMenu";

const lounge = venue({
  id: "zephyr",
  name: "Zephyr Lounge",
  food: true,
  outdoor: true,
  rating: 4.2,
  phone: "020 7946 0000",
  website: "https://zephyr.example",
  vibes: ["date-night", "groups"],
  dataSources: { shishaMenuUrl: "https://zephyr.example/shisha" },
  claimedBy: "owner-user-id",
  monetisationNotes: "Owes us a call",
  sourceNotes: "Scraped from directory",
});

const menu: VenueMenu = {
  sections: [
    { id: "s1", venueId: "zephyr", name: "Shisha", slug: "shisha", isShisha: true, sortOrder: 1, createdAt: "", updatedAt: "" },
    { id: "s2", venueId: "zephyr", name: "Empty", slug: "empty", isShisha: false, sortOrder: 2, createdAt: "", updatedAt: "" },
  ],
  items: [
    { id: "i1", venueId: "zephyr", sectionId: "s1", name: "Double apple", note: null, pricePence: 2500, isLive: true, sortOrder: 1, createdAt: "", updatedAt: "" },
    { id: "i2", venueId: "zephyr", sectionId: "s1", name: "Hidden", note: null, pricePence: 999, isLive: false, sortOrder: 2, createdAt: "", updatedAt: "" },
  ],
};

function input(overrides: Partial<VenueDetailsInput> = {}): VenueDetailsInput {
  return { venue: lounge, siteUrl: SITE_URL, featured: false, offers: [], menu, rating: null, bookingState: "live", availability: saturdayAvailability("zephyr"), query: {}, now: NOW, ...overrides };
}

describe("buildVenueDetails: listing", () => {
  const details = buildVenueDetails(input());

  it("returns what the venue page shows, with its link", () => {
    expect(details).toMatchObject({
      name: "Zephyr Lounge",
      url: `${SITE_URL}/venues/zephyr-lounge`,
      type: "Shisha lounge",
      area: "Soho",
      phone: "020 7946 0000",
      website: "https://zephyr.example",
      menuUrl: "https://zephyr.example/shisha",
      vibes: ["Date Night", "Groups"],
      claimed: true,
    });
    expect(details.amenities).toEqual(expect.arrayContaining(["Covered terrace", "Halal food served", "Indoor seating", "Group friendly"]));
  });

  it("never includes owner, monetisation or internal fields", () => {
    const json = JSON.stringify(details);
    for (const secret of ["owner-user-id", "Owes us a call", "Scraped from directory"]) expect(json).not.toContain(secret);
    for (const key of ["claimedBy", "monetisationNotes", "monetisationStatus", "partnerTier", "sourceNotes", "dataSources", "id"]) expect(details).not.toHaveProperty(key);
  });

  it("lists live menu items with prices and drops empty sections", () => {
    expect(details.menu).toEqual([{ section: "Shisha", items: [{ name: "Double apple", note: null, price: "£25" }] }]);
  });

  it("prefers published reviews over the listing rating", () => {
    expect(details.rating).toEqual({ average: 4.2, reviewCount: 0 });
    expect(buildVenueDetails(input({ rating: { averageRating: 4.66, reviewCount: 3 } })).rating).toEqual({ average: 4.7, reviewCount: 3 });
    expect(buildVenueDetails(input({ venue: { ...lounge, rating: null } })).rating).toBeNull();
  });
});

describe("buildVenueDetails: paid visibility", () => {
  it("marks featured venues and promoted offers", () => {
    const details = buildVenueDetails(input({ featured: true, offers: [offer("zephyr")] }));
    expect(details.featured).toBe(true);
    expect(details.offers).toEqual([{ title: "2-for-1 shisha", description: "Before 8pm", endsAt: "2026-11-01T00:00:00Z", promoted: true }]);
  });
});

describe("buildVenueDetails: booking requests", () => {
  it("lists free times over the next seven days, skipping days with none", () => {
    const { bookingRequests } = buildVenueDetails(input());
    expect(bookingRequests.acceptsRequests).toBe(true);
    expect(bookingRequests.freeTimes.map((day) => day.date)).toEqual([SATURDAY]);
    expect(bookingRequests.freeTimes[0].times).toContain("18:00");
  });

  it("leaves out a slot that is already full", () => {
    const { bookingRequests } = buildVenueDetails(input({ availability: saturdayAvailability("zephyr", [{ date: SATURDAY, time: "18:00" }]), query: { date: SATURDAY } }));
    expect(bookingRequests.freeTimes[0].times).not.toContain("18:00");
  });

  it("shows no times for a venue that cannot take requests", () => {
    expect(buildVenueDetails(input({ bookingState: "unclaimed" })).bookingRequests).toEqual({ acceptsRequests: false, freeTimes: [] });
  });

  it("rejects a malformed date", () => {
    expect(() => buildVenueDetails(input({ query: { date: "Saturday" } }))).toThrow("date must be YYYY-MM-DD.");
  });
});

describe("getNextLondonDates", () => {
  it("uses the UK date, not the server's", () => {
    // 23:30 UTC on the 23rd is 00:30 on the 24th in London (BST).
    expect(getNextLondonDates(new Date("2026-10-23T23:30:00Z"), 1)).toEqual(["2026-10-24"]);
  });

  it("steps calendar days across the clocks going back", () => {
    expect(getNextLondonDates(new Date("2026-10-24T23:30:00Z"), 3)).toEqual(["2026-10-25", "2026-10-26", "2026-10-27"]);
  });
});
