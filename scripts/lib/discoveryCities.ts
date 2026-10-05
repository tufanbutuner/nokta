/// <reference types="node" />

/**
 * Per-city discovery settings for `scripts/discover-venues.ts`.
 *
 * Coordinates deliberately live in `src/data/supportedCities.ts` and are not repeated here:
 * this file only carries what discovery needs on top of them, keyed by the same slug. A city
 * must exist there before it can be discovered, which keeps the app's city list and the
 * discovery list from drifting apart.
 */

export type DiscoveryCity = {
  /** Must match a slug in SUPPORTED_CITIES. */
  slug: string;
  /** Search bias radius. Big enough to cover the travel-to area, small enough to exclude the next city. */
  radiusKm: number;
  /**
   * Neighbourhoods appended to each query template. Chosen for places people actually search
   * for shisha, not for administrative completeness — an area with no lounges costs a call and
   * returns nothing useful.
   */
  areas: string[];
  /**
   * Substrings that confirm an address belongs to this city's catchment. Guards against the
   * bias circle pulling in a neighbouring town that happens to rank well.
   */
  addressMatchers: string[];
  /** Tranche number, so a run can be scoped with `--tranche=2`. */
  tranche: number;
};

export const DISCOVERY_CITIES: DiscoveryCity[] = [
  {
    slug: "london",
    radiusKm: 45,
    tranche: 1,
    areas: [
      "Central London", "Soho", "Mayfair", "Marylebone", "Edgware Road",
      "Camden", "Shoreditch", "Dalston", "Hackney", "Islington",
      "Brixton", "Clapham", "Tooting", "Croydon", "Greenwich",
      "Wembley", "Harrow", "Ealing", "Acton", "Hounslow",
      "Ilford", "Stratford", "Kingston", "Bromley",
    ],
    addressMatchers: ["london", "middlesex", "surrey", "essex"],
  },
  {
    slug: "birmingham",
    radiusKm: 20,
    tranche: 1,
    areas: [
      "Birmingham City Centre", "Digbeth", "Sparkhill", "Sparkbrook", "Small Heath",
      "Moseley", "Balsall Heath", "Highgate", "Jewellery Quarter", "Alum Rock",
      "Handsworth", "Aston", "Selly Oak", "Erdington",
    ],
    addressMatchers: ["birmingham", "west midlands"],
  },
  {
    slug: "manchester",
    radiusKm: 20,
    tranche: 1,
    areas: [
      "Manchester City Centre", "Rusholme", "Cheetham Hill", "Chorlton", "Levenshulme",
      "Fallowfield", "Didsbury", "Longsight", "Moss Side", "Northern Quarter",
      "Salford", "Spinningfields", "Withington",
    ],
    addressMatchers: ["manchester", "salford", "greater manchester"],
  },
  {
    slug: "leicester",
    radiusKm: 15,
    tranche: 1,
    areas: [
      "Leicester City Centre", "Highfields", "Belgrave", "Evington", "Clarendon Park",
      "Narborough Road", "Melton Road", "Oadby", "Braunstone",
    ],
    addressMatchers: ["leicester", "leicestershire"],
  },
  {
    slug: "glasgow",
    radiusKm: 18,
    tranche: 2,
    areas: [
      "Glasgow City Centre", "Merchant City", "Finnieston", "Govanhill", "Pollokshields",
      "West End", "Sauchiehall Street", "Shawlands",
    ],
    addressMatchers: ["glasgow", "lanarkshire", "renfrewshire"],
  },
  {
    slug: "leeds",
    radiusKm: 18,
    tranche: 3,
    areas: [
      "Leeds City Centre", "Harehills", "Hyde Park Leeds", "Headingley", "Chapeltown",
      "Beeston", "Roundhay",
    ],
    addressMatchers: ["leeds", "west yorkshire"],
  },
  {
    slug: "bradford",
    radiusKm: 15,
    tranche: 3,
    areas: [
      "Bradford City Centre", "Manningham", "Great Horton", "Little Horton", "Girlington",
      "Bradford Moor", "Shipley",
    ],
    addressMatchers: ["bradford", "west yorkshire"],
  },
  {
    slug: "sheffield",
    radiusKm: 15,
    tranche: 3,
    areas: [
      "Sheffield City Centre", "Burngreave", "Ecclesall Road", "London Road Sheffield",
      "Attercliffe", "Broomhill", "Firth Park",
    ],
    addressMatchers: ["sheffield", "south yorkshire"],
  },
  {
    slug: "liverpool",
    radiusKm: 15,
    tranche: 3,
    areas: [
      "Liverpool City Centre", "Toxteth", "Kensington Liverpool", "Wavertree",
      "Smithdown Road", "Lark Lane", "Bold Street",
    ],
    addressMatchers: ["liverpool", "merseyside"],
  },
  {
    slug: "nottingham",
    radiusKm: 15,
    tranche: 3,
    areas: [
      "Nottingham City Centre", "Hyson Green", "Radford", "Forest Fields", "Sneinton",
      "Lenton", "Mapperley",
    ],
    addressMatchers: ["nottingham", "nottinghamshire"],
  },
];

export function getDiscoveryCity(slug: string) {
  return DISCOVERY_CITIES.find((city) => city.slug === slug.toLowerCase());
}

export function getCitiesInTranche(tranche: number) {
  return DISCOVERY_CITIES.filter((city) => city.tranche === tranche);
}
