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
  {
    slug: "luton",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Luton Town Centre", "Bury Park", "Dallow Road", "High Town", "Leagrave",
      "Dunstable", "Stopsley",
    ],
    addressMatchers: ["luton", "dunstable", "bedfordshire"],
  },
  {
    slug: "slough",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Slough Town Centre", "Chalvey", "Langley Slough", "Farnham Road", "Cippenham",
      "Burnham", "Windsor",
    ],
    addressMatchers: ["slough", "berkshire", "windsor"],
  },
  {
    slug: "reading",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Reading Town Centre", "Oxford Road Reading", "Whitley", "Earley", "Caversham",
      "Tilehurst",
    ],
    addressMatchers: ["reading", "berkshire"],
  },
  {
    slug: "watford",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Watford Town Centre", "North Watford", "Bushey", "Garston Watford", "Croxley Green",
    ],
    addressMatchers: ["watford", "bushey", "hertfordshire"],
  },
  {
    slug: "coventry",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Coventry City Centre", "Foleshill", "Hillfields", "Earlsdon", "Stoke Coventry",
      "Radford Coventry", "Canley", "Tile Hill",
    ],
    addressMatchers: ["coventry", "west midlands"],
  },
  {
    slug: "wolverhampton",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Wolverhampton City Centre", "Whitmore Reans", "Penn", "Bilston", "Wednesfield",
      "Blakenhall", "Dudley",
    ],
    addressMatchers: ["wolverhampton", "bilston", "dudley", "west midlands"],
  },
  {
    slug: "bristol",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Bristol City Centre", "Easton Bristol", "St Pauls Bristol", "Stokes Croft",
      "Bedminster", "Clifton Bristol", "Fishponds",
    ],
    addressMatchers: ["bristol", "avon"],
  },
  {
    slug: "derby",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Derby City Centre", "Normanton Derby", "Pear Tree", "Alvaston", "Allenton",
      "Littleover",
    ],
    addressMatchers: ["derby", "derbyshire"],
  },
  {
    slug: "stoke-on-trent",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Hanley Stoke", "Stoke-on-Trent City Centre", "Shelton Stoke", "Burslem", "Longton",
      "Tunstall",
    ],
    addressMatchers: ["stoke-on-trent", "stoke on trent", "hanley", "staffordshire"],
  },
  {
    slug: "newcastle",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Newcastle City Centre", "Jesmond", "Fenham", "Heaton Newcastle", "Byker",
      "Gateshead", "Elswick",
    ],
    addressMatchers: ["newcastle", "gateshead", "tyne and wear", "tyne & wear"],
  },
  {
    slug: "bolton",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Bolton Town Centre", "Great Lever", "Deane", "Halliwell", "Farnworth",
    ],
    addressMatchers: ["bolton", "farnworth", "greater manchester"],
  },
  {
    slug: "blackburn",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Blackburn Town Centre", "Whalley Range Blackburn", "Audley Blackburn", "Little Harwood",
      "Darwen",
    ],
    addressMatchers: ["blackburn", "darwen", "lancashire"],
  },
  {
    slug: "preston",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Preston City Centre", "Deepdale", "Fishwick", "Frenchwood", "Ashton-on-Ribble",
    ],
    addressMatchers: ["preston", "lancashire"],
  },
  {
    slug: "oldham",
    radiusKm: 12,
    tranche: 4,
    areas: [
      "Oldham Town Centre", "Glodwick", "Werneth", "Chadderton", "Failsworth",
    ],
    addressMatchers: ["oldham", "chadderton", "failsworth", "greater manchester"],
  },
  {
    slug: "cardiff",
    radiusKm: 14,
    tranche: 4,
    areas: [
      "Cardiff City Centre", "Riverside Cardiff", "Grangetown", "Roath", "Cathays",
      "Canton Cardiff", "Butetown",
    ],
    addressMatchers: ["cardiff", "caerdydd", "south glamorgan"],
  },
];

export function getDiscoveryCity(slug: string) {
  return DISCOVERY_CITIES.find((city) => city.slug === slug.toLowerCase());
}

export function getCitiesInTranche(tranche: number) {
  return DISCOVERY_CITIES.filter((city) => city.tranche === tranche);
}
