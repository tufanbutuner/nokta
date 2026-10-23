import { VenueSearchQueryError } from "@/lib/venueSearch";
import type { WebMcpTool } from "@/types/webMcp";

/**
 * A small, stateless MCP server (https://modelcontextprotocol.io/specification)
 * for the Streamable HTTP transport: one JSON-RPC message in, one JSON response
 * out, no sessions and no server-sent events. The tools are the same ones the
 * site registers through WebMCP, so both stay in step. Pure: no HTTP here.
 */

/** Newest first; a client asking for another version gets the newest. */
export const MCP_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];

export interface McpServerInfo {
  name: string;
  title: string;
  version: string;
  instructions: string;
}

type JsonRpcId = string | number;

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: JsonRpcId | null; result: Record<string, unknown> }
  | { jsonrpc: "2.0"; id: JsonRpcId | null; error: { code: number; message: string } };

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

/** Handles one JSON-RPC message. Null for notifications, which get no reply. */
export async function handleMcpMessage(message: unknown, tools: WebMcpTool[], info: McpServerInfo): Promise<JsonRpcResponse | null> {
  if (!isRecord(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return failure(isRecord(message) ? getId(message) : null, INVALID_REQUEST, "Expected one JSON-RPC 2.0 request.");
  }
  if (!("id" in message)) return null;

  const id = getId(message);
  if (id === null) return failure(null, INVALID_REQUEST, "Request id must be a string or number.");
  const params = isRecord(message.params) ? message.params : {};

  switch (message.method) {
    case "initialize":
      return success(id, {
        protocolVersion: MCP_PROTOCOL_VERSIONS.includes(String(params.protocolVersion)) ? params.protocolVersion : MCP_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: info.name, title: info.title, version: info.version },
        instructions: info.instructions,
      });
    case "ping":
      return success(id, {});
    case "tools/list":
      return success(id, { tools: tools.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })) });
    case "tools/call":
      return callTool(id, params, tools);
    default:
      return failure(id, METHOD_NOT_FOUND, `Unknown method: ${message.method}.`);
  }
}

/** For a request body that was not valid JSON. */
export function parseErrorResponse(): JsonRpcResponse {
  return failure(null, PARSE_ERROR, "Request body is not valid JSON.");
}

async function callTool(id: JsonRpcId, params: Record<string, unknown>, tools: WebMcpTool[]): Promise<JsonRpcResponse> {
  const tool = tools.find((candidate) => candidate.name === params.name);
  if (!tool) return failure(id, INVALID_PARAMS, `Unknown tool: ${String(params.name)}. Available: ${tools.map((candidate) => candidate.name).join(", ")}.`);
  const args = params.arguments ?? {};
  if (!isRecord(args)) return failure(id, INVALID_PARAMS, "arguments must be an object.");

  try {
    return success(id, { content: [{ type: "text", text: await tool.execute(args) }], isError: false });
  } catch (error) {
    // Bad arguments are the caller's to fix, so say what was wrong; anything else stays generic.
    if (error instanceof VenueSearchQueryError) return success(id, { content: [{ type: "text", text: error.message }], isError: true });
    console.error("[mcp] tool failed", tool.name, error);
    return success(id, { content: [{ type: "text", text: "Nokta could not load venues just now. Try again shortly." }], isError: true });
  }
}

function success(id: JsonRpcId, result: Record<string, unknown>): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function failure(id: JsonRpcId | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function getId(message: Record<string, unknown>): JsonRpcId | null {
  return typeof message.id === "string" || typeof message.id === "number" ? message.id : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
