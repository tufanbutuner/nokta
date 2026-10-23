import { getModelContext } from "@/lib/webMcpSupport";
import { registerWebMcpTools } from "@/lib/webMcpTools";
import { getVenueDetailsForAssistant } from "@/services/venueDetailsService";
import { searchVenuesForAssistant } from "@/services/venueSearchService";

/** Registers Nokta's read-only WebMCP tools for agents browsing the site. Links point at this origin, so QA links stay on QA. */
export function startWebMcp(): void {
  const modelContext = getModelContext();
  if (!modelContext) return;
  const siteUrl = window.location.origin;
  registerWebMcpTools(modelContext, {
    searchVenues: (query) => searchVenuesForAssistant(query, siteUrl),
    getVenueDetails: (slug, query) => getVenueDetailsForAssistant(slug, query, siteUrl),
  });
}
