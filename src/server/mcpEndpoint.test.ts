import { describe, expect, it } from "vitest";
import { handleMcpHttpRequest } from "@/server/mcpEndpoint";
import type { WebMcpToolDeps } from "@/lib/webMcpTools";

const SITE_URL = "https://www.nokta.uk";
const deps: WebMcpToolDeps = {
  searchVenues: async () => ({ total: 1, results: [] }),
  getVenueDetails: async () => null,
};

const post = (body: unknown) => handleMcpHttpRequest({ method: "POST", body, siteUrl: SITE_URL }, deps);

describe("handleMcpHttpRequest", () => {
  it("answers a JSON-RPC request with JSON and open CORS", async () => {
    const response = await post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search_venues", arguments: { city: "London" } } });
    expect(response.status).toBe(200);
    expect(response.headers).toMatchObject({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    expect(JSON.parse(response.body ?? "")).toMatchObject({ id: 1, result: { isError: false } });
  });

  it("lists both venue tools", async () => {
    const response = await post({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = JSON.parse(response.body ?? "").result.tools as { name: string }[];
    expect(tools.map((tool) => tool.name)).toEqual(["search_venues", "get_venue_details"]);
  });

  it("parses a string body and reports invalid JSON", async () => {
    expect((await post('{"jsonrpc":"2.0","id":3,"method":"ping"}')).body).toBe('{"jsonrpc":"2.0","id":3,"result":{}}');
    expect(JSON.parse((await post("{nope")).body ?? "")).toMatchObject({ error: { code: -32700 } });
  });

  it("accepts notifications with 202 and no body", async () => {
    expect(await post({ jsonrpc: "2.0", method: "notifications/initialized" })).toMatchObject({ status: 202, body: null });
  });

  it("refuses GET, since there is no event stream", async () => {
    expect(await handleMcpHttpRequest({ method: "GET", body: undefined, siteUrl: SITE_URL }, deps)).toMatchObject({ status: 405, headers: { Allow: "POST, OPTIONS" } });
  });

  it("answers CORS preflight", async () => {
    expect(await handleMcpHttpRequest({ method: "OPTIONS", body: undefined, siteUrl: SITE_URL }, deps)).toMatchObject({ status: 204 });
  });
});
