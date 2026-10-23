/**
 * WebMCP (https://developer.chrome.com/docs/ai/webmcp): lets AI agents in the
 * browser call tools a page registers. Chrome exposes it on `document`; early
 * builds used `navigator`. Only the parts Nokta uses are typed here.
 */

export type WebMcpJsonSchema = {
  type: "object";
  properties: Record<string, WebMcpJsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
};

export type WebMcpJsonSchemaProperty =
  | { type: "string"; description: string; enum?: readonly string[]; pattern?: string }
  | { type: "integer"; description: string; minimum?: number; maximum?: number }
  | { type: "boolean"; description: string };

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: WebMcpJsonSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean; consequentialHint?: boolean };
  execute: (args: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<string>;
}

export interface WebMcpModelContext {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
}

declare global {
  interface Document {
    modelContext?: WebMcpModelContext;
  }
  interface Navigator {
    modelContext?: WebMcpModelContext;
  }
}
