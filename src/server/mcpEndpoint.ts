import { MCP_SERVER_INFO } from "@/lib/agentDiscovery";
import { handleMcpMessage, parseErrorResponse } from "@/lib/mcpServer";
import { buildWebMcpTools, type WebMcpToolDeps } from "@/lib/webMcpTools";
import { getVenueDetailsForAssistant } from "@/services/venueDetailsService";
import { searchVenuesForAssistant } from "@/services/venueSearchService";

/**
 * Nokta's public MCP endpoint over HTTP. Read-only, no sign-in. Built into
 * server-dist/ by vite.mcp.config.ts and served by api/mcp.ts.
 */

export interface McpHttpRequest {
  method: string;
  /** Parsed JSON, or a string if the platform left it unparsed. */
  body: unknown;
  /** Origin links should point at, e.g. https://www.nokta.uk; QA stays on QA. */
  siteUrl: string;
}

export interface McpHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string | null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
};

export async function handleMcpHttpRequest(request: McpHttpRequest, deps: WebMcpToolDeps = venueDeps(request.siteUrl)): Promise<McpHttpResponse> {
  if (request.method === "OPTIONS") return { status: 204, headers: CORS_HEADERS, body: null };
  // Stateless and JSON-only: no event stream to open (GET) and no session to end (DELETE).
  if (request.method !== "POST") return { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" }, body: null };

  const message = parseBody(request.body);
  const response = message === undefined ? parseErrorResponse() : await handleMcpMessage(message, buildWebMcpTools(deps), MCP_SERVER_INFO);
  if (!response) return { status: 202, headers: CORS_HEADERS, body: null };
  return { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(response) };
}

function venueDeps(siteUrl: string): WebMcpToolDeps {
  return {
    searchVenues: (query) => searchVenuesForAssistant(query, siteUrl),
    getVenueDetails: (slug, query) => getVenueDetailsForAssistant(slug, query, siteUrl),
  };
}

/** Undefined when the body is not JSON. */
function parseBody(body: unknown): unknown {
  if (typeof body !== "string") return body ?? undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}
