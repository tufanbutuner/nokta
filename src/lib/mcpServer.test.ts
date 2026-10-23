import { describe, expect, it } from "vitest";
import { MCP_SERVER_INFO } from "@/lib/agentDiscovery";
import { handleMcpMessage, MCP_PROTOCOL_VERSIONS } from "@/lib/mcpServer";
import { VenueSearchQueryError } from "@/lib/venueSearch";
import type { WebMcpTool } from "@/types/webMcp";

const echo: WebMcpTool = {
  name: "echo",
  description: "Returns its arguments.",
  inputSchema: { type: "object", properties: { text: { type: "string", description: "Anything." } } },
  annotations: { readOnlyHint: true },
  execute: async (args) => {
    if (args.text === "bad") throw new VenueSearchQueryError("text must not be bad.");
    if (args.text === "boom") throw new Error("database down");
    return JSON.stringify(args);
  },
};

const call = (message: unknown) => handleMcpMessage(message, [echo], MCP_SERVER_INFO);

describe("handleMcpMessage", () => {
  it("initializes with the client's protocol version when supported, else the newest", async () => {
    const supported = await call({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    expect(supported).toMatchObject({ id: 1, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "uk.nokta/venues" } } });

    const unknown = await call({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } });
    expect(unknown).toMatchObject({ result: { protocolVersion: MCP_PROTOCOL_VERSIONS[0] } });
  });

  it("does not reply to notifications", async () => {
    expect(await call({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
  });

  it("lists tools without their execute function", async () => {
    const response = await call({ jsonrpc: "2.0", id: "a", method: "tools/list" });
    expect(response).toEqual({ jsonrpc: "2.0", id: "a", result: { tools: [{ name: "echo", description: echo.description, inputSchema: echo.inputSchema, annotations: { readOnlyHint: true } }] } });
  });

  it("calls a tool and returns its text", async () => {
    const response = await call({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "echo", arguments: { text: "hi" } } });
    expect(response).toEqual({ jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: '{"text":"hi"}' }], isError: false } });
  });

  it("reports bad arguments as a tool error the caller can fix", async () => {
    const response = await call({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "echo", arguments: { text: "bad" } } });
    expect(response).toMatchObject({ result: { content: [{ text: "text must not be bad." }], isError: true } });
  });

  it("hides internal failures behind a generic message", async () => {
    const response = await call({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "echo", arguments: { text: "boom" } } });
    expect(JSON.stringify(response)).not.toContain("database");
    expect(response).toMatchObject({ result: { isError: true } });
  });

  it.each([
    [{ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "book_table" } }, -32602],
    [{ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "echo", arguments: [] } }, -32602],
    [{ jsonrpc: "2.0", id: 8, method: "resources/list" }, -32601],
    [{ jsonrpc: "2.0", id: 9 }, -32600],
    [[{ jsonrpc: "2.0", id: 10, method: "ping" }], -32600],
  ])("rejects %j with code %i", async (message, code) => {
    expect(await call(message)).toMatchObject({ error: { code } });
  });

  it("answers ping", async () => {
    expect(await call({ jsonrpc: "2.0", id: 11, method: "ping" })).toEqual({ jsonrpc: "2.0", id: 11, result: {} });
  });
});
