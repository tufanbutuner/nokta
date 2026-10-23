/**
 * Nokta's public, read-only MCP server: https://www.nokta.uk/mcp (rewritten here
 * in vercel.json). The logic lives in src/server/mcpEndpoint.ts and is bundled
 * into server-dist/ by `npm run build:mcp`, which the build runs first.
 */
// @ts-expect-error server-dist is generated at build time.
import { handleMcpHttpRequest } from "../server-dist/mcp.js";

type HandlerRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type HandlerResponse = {
  status: (code: number) => HandlerResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  end: () => void;
};

type McpHttpResponse = { status: number; headers: Record<string, string>; body: string | null };

/** Same (request, response) signature as send-notification-email: a returned web Response would hang. */
export default async function handler(request: HandlerRequest, response: HandlerResponse) {
  const result: McpHttpResponse = await handleMcpHttpRequest({ method: request.method ?? "GET", body: request.body, siteUrl: getSiteUrl(request) });
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.status(result.status);
  if (result.body === null) response.end();
  else response.send(result.body);
}

function getSiteUrl(request: HandlerRequest) {
  const host = firstHeader(request.headers["x-forwarded-host"]) ?? firstHeader(request.headers.host) ?? "www.nokta.uk";
  return `https://${host}`;
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
