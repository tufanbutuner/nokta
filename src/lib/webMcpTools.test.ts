import { describe, expect, it, vi } from "vitest";
import { MAX_SEARCH_LIMIT, registerWebMcpTools, type WebMcpToolDeps } from "@/lib/webMcpTools";
import type { VenueSearchQuery } from "@/lib/venueSearch";
import type { WebMcpModelContext, WebMcpTool } from "@/types/webMcp";

function setup() {
  const registered: { tool: WebMcpTool; signal?: AbortSignal }[] = [];
  const modelContext: WebMcpModelContext = { registerTool: (tool, options) => registered.push({ tool, signal: options?.signal }) };
  const deps: WebMcpToolDeps = {
    searchVenues: vi.fn(async (query: VenueSearchQuery) => ({ total: 0, results: [], query })),
    getVenueDetails: vi.fn(async () => null),
  };
  const controller = registerWebMcpTools(modelContext, deps);
  const tool = (name: string) => {
    const found = registered.find((entry) => entry.tool.name === name)?.tool;
    if (!found) throw new Error(`${name} not registered`);
    return found;
  };
  return { registered, deps, controller, tool };
}

describe("registerWebMcpTools", () => {
  it("registers read-only search and details tools", () => {
    const { registered } = setup();
    expect(registered.map((entry) => entry.tool.name)).toEqual(["search_venues", "get_venue_details"]);
    for (const { tool } of registered) {
      expect(tool.annotations).toEqual({ readOnlyHint: true });
      expect(tool.description).toContain("cannot book");
      for (const name of tool.inputSchema.required ?? []) expect(tool.inputSchema.properties).toHaveProperty(name);
    }
  });

  it("removes the tools when the controller aborts", () => {
    const { registered, controller } = setup();
    controller.abort();
    expect(registered.every((entry) => entry.signal?.aborted)).toBe(true);
  });

  it("offers every venue type in the search schema", () => {
    const { tool } = setup();
    const type = tool("search_venues").inputSchema.properties.type;
    expect(type.type === "string" && type.enum).toContain("shisha_lounge");
  });
});

describe("search_venues", () => {
  it("passes a checked query through and returns JSON", async () => {
    const { tool, deps } = setup();
    const result = await tool("search_venues").execute({ city: " London ", type: "shisha_lounge", date: "2026-10-24", time: "19:00", partySize: 4, hasOffer: true, limit: 500 });
    expect(deps.searchVenues).toHaveBeenCalledWith({ city: "London", area: undefined, type: "shisha_lounge", date: "2026-10-24", time: "19:00", partySize: 4, hasOffer: true, limit: MAX_SEARCH_LIMIT });
    expect(JSON.parse(result)).toMatchObject({ total: 0, results: [] });
  });

  it.each([
    [{ town: "London" }, "Unknown argument: town."],
    [{ type: "nightclub" }, "type must be one of"],
    [{ partySize: "4" }, "partySize must be a whole number."],
    [{ hasOffer: "yes" }, "hasOffer must be true or false."],
  ])("rejects %o", async (args, message) => {
    const { tool } = setup();
    await expect(tool("search_venues").execute(args)).rejects.toThrow(message);
  });
});

describe("get_venue_details", () => {
  it("needs a slug", async () => {
    const { tool } = setup();
    await expect(tool("get_venue_details").execute({})).rejects.toThrow("slug is required.");
  });

  it("says when there is no such venue", async () => {
    const { tool, deps } = setup();
    const result = JSON.parse(await tool("get_venue_details").execute({ slug: "nowhere", date: "2026-10-24" }));
    expect(deps.getVenueDetails).toHaveBeenCalledWith("nowhere", { date: "2026-10-24", partySize: undefined });
    expect(result).toEqual({ found: false, message: 'No venue with slug "nowhere". Use search_venues to find one.' });
  });
});
