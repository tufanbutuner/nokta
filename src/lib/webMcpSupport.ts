import type { WebMcpModelContext } from "@/types/webMcp";

/** The browser's WebMCP model context, or null where WebMCP is not available. Kept tiny: it runs at boot. */
export function getModelContext(): WebMcpModelContext | null {
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  return null;
}
