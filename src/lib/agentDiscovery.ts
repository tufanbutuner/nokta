import type { SupportedCity } from "@/types/city";

/**
 * Files that tell AI assistants and agent registries what Nokta is and where its
 * resources live: `llms.txt` (https://llmstxt.org/) and the Agentic Resource
 * Discovery manifest served at `/.well-known/ard.json`
 * (https://agenticresourcediscovery.org/spec/). Both are generated at build time
 * from the city list so they cannot drift from what the site serves.
 */

const PUBLISHER = "nokta.uk";

export interface ArdEntry {
  identifier: string;
  displayName: string;
  type: string;
  url: string;
  description: string;
  representativeQueries: string[];
}

export interface ArdManifest {
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
    entries: [
      {
        identifier: `urn:air:${PUBLISHER}:site:llms-txt`,
        displayName: "Nokta venue guide",
        type: "text/markdown",
        url: `${siteUrl}/llms.txt`,
        description: "What Nokta is, how booking requests work, and links to every city's venues.",
        representativeQueries: [
          "find a shisha lounge in London",
          "shisha lounges in Birmingham open tonight",
          "where can I book a lounge for a birthday in Manchester",
        ],
      },
    ],
  };
}
