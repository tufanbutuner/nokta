import { describe, expect, it } from "vitest";
import { searchVenues, VenueSearchQueryError, type VenueSearchContext } from "@/lib/venueSearch";
import { expandBookedSlotCounts } from "@/services/venueSearchService";
import { NOW, offer, placement, SATURDAY, saturdayAvailability, SITE_URL, venue } from "@/test/venueFixtures";
import type { VenueBookingAvailability, VenueBookingState } from "@/types/bookingAvailability";

const zephyr = venue({ id: "zephyr", name: "Zephyr Lounge" });
const amber = venue({ id: "amber", name: "Amber Lounge", area: "Edgware Road", isClaimed: false });
const mango = venue({ id: "mango", name: "Mango Lounge" });
const brum = venue({ id: "brum", name: "Brum Lounge", city: "Birmingham", area: "Digbeth" });
const cafe = venue({ id: "cafe", name: "Cafe Nero", primaryCategory: "cafe" });

function context(overrides: Partial<VenueSearchContext> = {}): VenueSearchContext {
  return { venues: [zephyr, amber, mango, brum, cafe], placements: [], offers: [], siteUrl: SITE_URL, now: NOW, ...overrides };
}

const names = (response: ReturnType<typeof searchVenues>) => response.results.map((result) => result.name);

describe("searchVenues: place and type", () => {
  it("matches the city case-insensitively and orders by name", () => {
    expect(names(searchVenues(context(), { city: "london", type: "shisha_lounge" }))).toEqual(["Amber Lounge", "Mango Lounge", "Zephyr Lounge"]);
  });

  it("matches part of an area name", () => {
    expect(names(searchVenues(context(), { city: "London", area: "edgware" }))).toEqual(["Amber Lounge"]);
  });

  it("filters by venue type", () => {
    expect(names(searchVenues(context(), { type: "cafe" }))).toEqual(["Cafe Nero"]);
  });

  it("searches every city when none is given", () => {
    expect(searchVenues(context(), {}).total).toBe(5);
  });
});

describe("searchVenues: paid visibility", () => {
  it("puts featured venues first in placement priority order and marks them", () => {
    const response = searchVenues(context({ placements: [placement("zephyr", 10), placement("mango", 5)] }), { city: "London", type: "shisha_lounge" });
    expect(names(response)).toEqual(["Zephyr Lounge", "Mango Lounge", "Amber Lounge"]);
    expect(response.results.map((result) => result.featured)).toEqual([true, true, false]);
  });

  it("marks offers as promoted and can require one", () => {
    const response = searchVenues(context({ offers: [offer("mango")] }), { city: "London", hasOffer: true });
    expect(names(response)).toEqual(["Mango Lounge"]);
    expect(response.results[0].offers).toEqual([{ title: "2-for-1 shisha", description: "Before 8pm", endsAt: "2026-11-01T00:00:00Z", promoted: true }]);
  });
});

describe("searchVenues: free date and time", () => {
  const states = new Map<string, VenueBookingState>([["zephyr", "live"], ["mango", "live"], ["amber", "unclaimed"]]);
  const availability = new Map<string, VenueBookingAvailability | null>([
    ["zephyr", saturdayAvailability("zephyr")],
    ["mango", saturdayAvailability("mango", [{ date: SATURDAY, time: "18:00" }])],
    ["amber", saturdayAvailability("amber")],
  ]);
  const withAvailability = context({ bookingStates: states, availability });

  it("lists free times for the date and skips venues that cannot take requests", () => {
    const response = searchVenues(withAvailability, { city: "London", date: SATURDAY });
    expect(names(response)).toEqual(["Mango Lounge", "Zephyr Lounge"]);
    expect(response.results.find((result) => result.name === "Zephyr Lounge")?.freeTimes).toContain("18:00");
    expect(response.results.find((result) => result.name === "Mango Lounge")?.freeTimes).not.toContain("18:00");
  });

  it("drops a venue whose slot is already full at the requested time", () => {
    expect(names(searchVenues(withAvailability, { city: "London", date: SATURDAY, time: "18:00" }))).toEqual(["Zephyr Lounge"]);
  });

  it("drops venues outside their booking hours", () => {
    expect(searchVenues(withAvailability, { city: "London", date: SATURDAY, time: "22:00" }).total).toBe(0);
  });

  it("respects party size limits", () => {
    expect(searchVenues(withAvailability, { city: "London", date: SATURDAY, time: "18:30", partySize: 12 }).total).toBe(0);
  });
});

describe("searchVenues: no match", () => {
  const states = new Map<string, VenueBookingState>([["zephyr", "live"], ["mango", "live"], ["amber", "unclaimed"]]);
  const availability = new Map<string, VenueBookingAvailability | null>([
    ["zephyr", saturdayAvailability("zephyr")],
    ["mango", saturdayAvailability("mango")],
  ]);
  const withAvailability = context({ bookingStates: states, availability, placements: [placement("mango", 1)] });
  const changes = (response: ReturnType<typeof searchVenues>) => response.noMatch?.alternatives.map((alternative) => alternative.change);

  it("says nothing matched and offers other times that day, then the search without a date", () => {
    const response = searchVenues(withAvailability, { city: "London", date: SATURDAY, time: "22:00" });
    expect(response.total).toBe(0);
    expect(response.noMatch?.message).toBe("No venues matched this search. Here are close alternatives.");
    expect(changes(response)).toEqual([`Other free times on ${SATURDAY}`, expect.stringContaining("Without a date")]);

    const [otherTimes] = response.noMatch?.alternatives ?? [];
    expect(otherTimes.query).toMatchObject({ city: "London", date: SATURDAY, time: undefined });
    expect(otherTimes.results.map((result) => [result.name, result.featured, result.url])).toEqual([
      ["Mango Lounge", true, `${SITE_URL}/venues/mango-lounge`],
      ["Zephyr Lounge", false, `${SITE_URL}/venues/zephyr-lounge`],
    ]);
    expect(otherTimes.results[0].freeTimes).toContain("18:00");
  });

  it("offers only the first later day with free times", () => {
    const response = searchVenues(withAvailability, { city: "London", date: "2026-10-23" });
    expect(changes(response)?.[0]).toBe(`Free on ${SATURDAY} instead`);
    expect(changes(response)?.filter((change) => change?.startsWith("Free on"))).toHaveLength(1);
  });

  it("widens the area to the whole city", () => {
    const response = searchVenues(context(), { city: "London", area: "Mayfair" });
    expect(changes(response)?.[0]).toBe("Anywhere in London");
    expect(response.noMatch?.alternatives[0].total).toBe(4);
    expect(response.noMatch?.alternatives[0].results).toHaveLength(3);
  });

  it("drops the offer filter, then the type", () => {
    const response = searchVenues(context({ offers: [offer("mango")] }), { city: "London", type: "cafe", hasOffer: true });
    expect(changes(response)).toEqual(["Without needing an offer", "Any venue type"]);
    expect(response.noMatch?.alternatives.map((alternative) => alternative.results.map((result) => result.name))).toEqual([["Cafe Nero"], ["Mango Lounge"]]);
  });

  it("says so when no alternative finds anything either", () => {
    const response = searchVenues(context({ venues: [] }), { city: "London", type: "cafe" });
    expect(response).toEqual({
      total: 0,
      results: [],
      noMatch: { message: "No venues matched this search, and loosening one filter found nothing either. Try another city or fewer filters.", alternatives: [] },
    });
  });

  it("is left out when something matches", () => {
    expect(searchVenues(context(), { city: "London" }).noMatch).toBeUndefined();
  });
});

describe("searchVenues: results", () => {
  it("links to the venue page, flags unclaimed listings and caps the list", () => {
    const response = searchVenues(context(), { city: "London", type: "shisha_lounge", limit: 1 });
    expect(response.total).toBe(3);
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({ name: "Amber Lounge", url: `${SITE_URL}/venues/amber-lounge`, claimed: false, type: "Shisha lounge", priceLevel: "££" });
  });

  it("shortens long descriptions at a word boundary", () => {
    const long = venue({ id: "long", name: "Long Lounge", description: "word ".repeat(100) });
    const [result] = searchVenues(context({ venues: [long] }), {}).results;
    expect(result.summary.length).toBeLessThanOrEqual(221);
    expect(result.summary.endsWith("word…")).toBe(true);
  });
});

describe("searchVenues: query checks", () => {
  it.each([
    [{ date: "24/10/2026" }, "date must be YYYY-MM-DD."],
    [{ date: SATURDAY, time: "7pm" }, "time must be HH:MM, 24-hour."],
    [{ time: "19:00" }, "time needs a date."],
    [{ partySize: 0 }, "partySize must be a whole number of at least 1."],
  ])("rejects %o", (query, message) => {
    expect(() => searchVenues(context(), query)).toThrow(new VenueSearchQueryError(message));
  });
});

describe("expandBookedSlotCounts", () => {
  it("turns a count into that many occupied slots per venue", () => {
    const slots = expandBookedSlotCounts([{ venue_id: "a", slot_date: SATURDAY, slot_time: "18:00", taken: 2 }]);
    expect(slots.get("a")).toEqual([{ date: SATURDAY, time: "18:00" }, { date: SATURDAY, time: "18:00" }]);
  });
});
