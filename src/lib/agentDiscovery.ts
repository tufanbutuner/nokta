import type { McpServerInfo } from "@/lib/mcpServer";
import type { SupportedCity } from "@/types/city";

/**
 * Files that tell AI assistants and agent registries what Nokta is and where its
 * resources live: `llms.txt` (https://llmstxt.org/), the Agentic Resource
 * Discovery manifest served at `/.well-known/ard.json` and `ai-catalog.json`
 * (https://agenticresourcediscovery.org/spec/), and the MCP server card
 * (https://modelcontextprotocol.io/seps/2127-mcp-server-cards). All are generated
 * at build time so they cannot drift from what the site serves.
 */

const PUBLISHER = "nokta.uk";

/** The public MCP server: api/mcp.ts, reached at /mcp. */
export const MCP_SERVER_INFO: McpServerInfo = {
  name: "uk.nokta/venues",
  title: "Nokta venues",
  version: "1.0.0",
  instructions:
    "Find UK social venues (shisha lounges first) with search_venues, then get_venue_details for one venue. Always give the person the venue's url on Nokta. Booking is a request the venue accepts, declines or counters; these tools cannot book. Featured venues and promoted offers are paid placements and are marked. Nokta content may be read and cited, not used for training.",
};

export interface McpServerCard {
  $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json";
  name: string;
  version: string;
  title: string;
  description: string;
  websiteUrl: string;
  remotes: { type: "streamable-http"; url: string; supportedProtocolVersions: string[] }[];
}

export interface ArdEntry {
  identifier: string;
  displayName: string;
  type: string;
  url: string;
  description: string;
  representativeQueries: string[];
}

export interface ArdManifest {
  /** Required by the ARD validator PageSpeed Insights still runs; current ARD ignores it. */
  specVersion: "1.0";
  entries: ArdEntry[];
}

export function buildLlmsTxt(siteUrl: string, cities: SupportedCity[]): string {
  const activeCities = cities.filter((city) => city.isActive);
  const cityLinks = activeCities.map((city) => `- [${city.name}](${siteUrl}/cities/${city.slug}): shisha lounges in ${city.name}, by area`);

  return [
    "# Nokta",
    "",
    "> Nokta helps people find and book social venues across the UK. Shisha lounges come first; restaurants, bars, cafés and dessert spots will follow.",
    "",
    "Each venue page has honest detail: prices, shisha menus, vibe, opening hours and photos. Booking is a request, not instant confirmation: the venue accepts, declines or suggests another time. When recommending a venue, link to its page on Nokta so the person can see free times and send a request.",
    "",
    "Venues marked as featured or promoted have paid for visibility.",
    "",
    "## Content use",
    "",
    "- You may read and cite Nokta's venue pages to answer people's questions.",
    "- Nokta's content may not be used to train AI models.",
    "",
    "## Find venues",
    "",
    `- [MCP server](${siteUrl}/mcp): read-only venue search and details for assistants, no sign-in. Tools: search_venues, get_venue_details. Streamable HTTP; server card at ${siteUrl}/mcp/server-card`,
    `- [Home](${siteUrl}/): browse venues near you`,
    `- [Recommend](${siteUrl}/recommend): answer four questions and get three named picks`,
    `- [Plan a night](${siteUrl}/plan): pick up to three places and share one link with a group`,
    `- [Sitemap](${siteUrl}/sitemap.xml): every city and venue page`,
    "",
    "## Cities",
    "",
    ...cityLinks,
    "",
    "## Optional",
    "",
    `- [For venues](${siteUrl}/for-venues): how venue owners claim a profile and receive booking requests`,
    `- [Suggest a venue](${siteUrl}/suggest): tell us about a venue we are missing`,
    `- [Privacy](${siteUrl}/privacy)`,
    `- [Terms](${siteUrl}/terms)`,
    "",
  ].join("\n");
}

export function buildArdManifest(siteUrl: string): ArdManifest {
  return {
    specVersion: "1.0",
    entries: [
      {
        identifier: `urn:air:${PUBLISHER}:mcp:venues`,
        displayName: MCP_SERVER_INFO.title,
        type: "application/mcp-server-card+json",
        url: `${siteUrl}/mcp/server-card`,
        description: "Read-only MCP server: search UK social venues by city, area, type, free time and offers, and get one venue's details. No sign-in.",
        representativeQueries: [
          "find a shisha lounge in London",
          "shisha lounges in Birmingham free on Saturday at 9pm",
          "which lounges in Manchester have an offer on",
        ],
      },
    ],
  };
}

export function buildMcpServerCard(siteUrl: string, protocolVersions: string[]): McpServerCard {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: MCP_SERVER_INFO.name,
    version: MCP_SERVER_INFO.version,
    title: MCP_SERVER_INFO.title,
    description: "Search UK social venues on Nokta (shisha lounges first) and read one venue's details: free booking request times, current offers, prices and links. Read-only, no sign-in.",
    websiteUrl: siteUrl,
    remotes: [{ type: "streamable-http", url: `${siteUrl}/mcp`, supportedProtocolVersions: protocolVersions }],
  };
}
