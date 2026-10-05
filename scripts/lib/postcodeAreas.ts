/// <reference types="node" />

/**
 * Postcode district -> neighbourhood, used only when Google returns no neighbourhood component
 * and the address line is a street.
 *
 * Why this exists: `area` is a browsable filter and an analytics dimension, so the choice for a
 * venue Google gives no locality for is between a street name ("45 Frith St"), the bare city
 * ("London") or the district's actual name ("Soho"). The first invents a facet, the second is
 * honest but useless for browsing. A postcode district is a real, stable administrative fact,
 * so it is the best answer available without another API call.
 *
 * Scope is deliberately narrow: districts seen in real discovery output, plus the obvious
 * neighbours. An unmapped district falls back to the city name rather than a guess, so missing
 * entries degrade honestly. Add districts as discovery surfaces them.
 *
 * Sources: Royal Mail district definitions and the commonly used names for them. Where a
 * district spans several neighbourhoods, the name people would search for is preferred over
 * the strictly correct postal one.
 */

const LONDON_DISTRICTS: Record<string, string> = {
  // West End and central
  W1A: "Marylebone", W1B: "Fitzrovia", W1C: "Marylebone", W1D: "Soho",
  W1F: "Soho", W1G: "Marylebone", W1H: "Marylebone", W1J: "Mayfair",
  W1K: "Mayfair", W1S: "Mayfair", W1T: "Fitzrovia", W1U: "Marylebone", W1W: "Fitzrovia",
  WC1A: "Bloomsbury", WC1B: "Bloomsbury", WC1E: "Bloomsbury", WC1H: "Bloomsbury",
  WC1N: "Bloomsbury", WC1R: "Clerkenwell", WC1V: "Holborn", WC1X: "King's Cross",
  WC2A: "Holborn", WC2B: "Covent Garden", WC2E: "Covent Garden",
  WC2H: "Covent Garden", WC2N: "Charing Cross", WC2R: "Strand",

  // West
  W2: "Paddington", W3: "Acton", W4: "Chiswick", W5: "Ealing", W6: "Hammersmith",
  W7: "Hanwell", W8: "Kensington", W9: "Maida Vale", W10: "North Kensington",
  W11: "Notting Hill", W12: "Shepherd's Bush", W13: "West Ealing", W14: "West Kensington",

  // South West
  SW1A: "Westminster", SW1E: "Victoria", SW1H: "Westminster", SW1P: "Pimlico",
  SW1V: "Pimlico", SW1W: "Belgravia", SW1X: "Knightsbridge", SW1Y: "St James's",
  SW2: "Brixton", SW3: "Chelsea", SW4: "Clapham", SW5: "Earl's Court",
  SW6: "Fulham", SW7: "South Kensington", SW8: "Nine Elms", SW9: "Brixton",
  SW10: "West Brompton", SW11: "Battersea", SW12: "Balham", SW15: "Putney",
  SW13: "Barnes", SW14: "Mortlake", SW16: "Streatham", SW17: "Tooting",
  SW18: "Wandsworth", SW19: "Wimbledon", SW20: "Raynes Park",

  // North West
  NW1: "Camden Town", NW2: "Cricklewood", NW3: "Hampstead", NW4: "Hendon",
  NW5: "Kentish Town", NW6: "Kilburn", NW7: "Mill Hill", NW8: "St John's Wood",
  NW9: "Kingsbury", NW10: "Willesden", NW11: "Golders Green",

  // North
  N1: "Islington", N2: "East Finchley", N4: "Finsbury Park", N5: "Highbury",
  N6: "Highgate", N7: "Holloway", N8: "Crouch End", N10: "Muswell Hill",
  N3: "Finchley", N9: "Lower Edmonton", N11: "New Southgate",
  N12: "North Finchley", N13: "Palmers Green", N14: "Southgate",
  N15: "South Tottenham", N16: "Stoke Newington", N17: "Tottenham",
  N18: "Upper Edmonton", N19: "Archway", N20: "Whetstone",
  N21: "Winchmore Hill", N22: "Wood Green",

  // East and City
  EC1A: "Clerkenwell", EC1M: "Clerkenwell", EC1N: "Clerkenwell",
  EC1R: "Clerkenwell", EC1V: "Old Street", EC1Y: "Clerkenwell",
  EC2A: "Shoreditch", EC2M: "Liverpool Street", EC2N: "City of London",
  EC3A: "City of London", EC4M: "City of London",
  E1: "Whitechapel", E2: "Bethnal Green", E3: "Bow", E4: "Chingford",
  E5: "Hackney", E6: "East Ham", E7: "Forest Gate", E8: "Dalston",
  E9: "Homerton", E10: "Leyton", E11: "Leytonstone", E12: "Manor Park",
  E13: "Plaistow", E14: "Canary Wharf", E15: "Stratford",
  E16: "Royal Docks", E17: "Walthamstow", E18: "South Woodford", E20: "Stratford",

  // South East
  SE1: "Bermondsey", SE5: "Camberwell", SE8: "Deptford", SE10: "Greenwich",
  SE11: "Kennington", SE13: "Lewisham", SE15: "Peckham", SE16: "Rotherhithe",
  SE17: "Walworth", SE18: "Woolwich", SE19: "Upper Norwood", SE20: "Penge",
  SE22: "East Dulwich", SE23: "Forest Hill", SE24: "Herne Hill",
  SE25: "South Norwood", SE26: "Sydenham", SE28: "Thamesmead",
};

/**
 * Birmingham districts. The shisha trade clusters along the Stratford Road and Coventry Road
 * corridors, so B10–B12 and B5 carry most of it.
 */
const BIRMINGHAM_DISTRICTS: Record<string, string> = {
  B1: "City Centre", B2: "City Centre", B3: "City Centre", B4: "City Centre",
  B5: "Highgate", B6: "Aston", B7: "Nechells", B8: "Washwood Heath",
  B9: "Bordesley Green", B10: "Small Heath", B11: "Sparkhill", B12: "Balsall Heath",
  B13: "Moseley", B14: "Kings Heath", B15: "Edgbaston", B16: "Ladywood",
  B17: "Harborne", B18: "Jewellery Quarter", B19: "Lozells", B20: "Handsworth Wood",
  B21: "Handsworth", B23: "Erdington", B24: "Erdington", B25: "Yardley",
  B26: "Sheldon", B27: "Acocks Green", B28: "Hall Green", B29: "Selly Oak",
  B30: "Kings Norton", B31: "Northfield", B32: "Quinton", B33: "Stechford",
  B34: "Shard End", B36: "Castle Bromwich", B42: "Perry Barr", B44: "Kingstanding",
};

/**
 * Manchester districts. M14 (Rusholme, the Curry Mile) and M8 (Cheetham Hill) are the two
 * areas that matter most for shisha.
 */
const MANCHESTER_DISTRICTS: Record<string, string> = {
  M1: "City Centre", M2: "City Centre", M3: "Spinningfields", M4: "Northern Quarter",
  M5: "Salford", M6: "Salford", M7: "Broughton", M8: "Cheetham Hill",
  M9: "Blackley", M11: "Clayton", M12: "Ardwick", M13: "Longsight",
  M14: "Rusholme", M15: "Hulme", M16: "Whalley Range", M17: "Trafford Park",
  M18: "Gorton", M19: "Levenshulme", M20: "Didsbury", M21: "Chorlton",
  M22: "Wythenshawe", M23: "Baguley", M25: "Prestwich", M30: "Eccles",
  M32: "Stretford", M33: "Sale", M40: "Miles Platting",
};

/** Leicester districts. LE1 is the centre; LE2 and LE4 hold Highfields and Belgrave. */
const LEICESTER_DISTRICTS: Record<string, string> = {
  LE1: "City Centre", LE2: "Highfields", LE3: "Westcotes", LE4: "Belgrave",
  LE5: "Evington", LE9: "Narborough", LE16: "Market Harborough", LE18: "Wigston",
};

/** Per-city tables, keyed by the slug used in SUPPORTED_CITIES. */
const DISTRICTS_BY_CITY: Record<string, Record<string, string>> = {
  london: LONDON_DISTRICTS,
  birmingham: BIRMINGHAM_DISTRICTS,
  manchester: MANCHESTER_DISTRICTS,
  leicester: LEICESTER_DISTRICTS,
};

/**
 * Returns the neighbourhood for a postcode's district, or null when it is not mapped.
 * Null is deliberate: the caller should fall back to the city name rather than invent an area.
 */
export function areaFromPostcode(postcode: string, citySlug: string): string | null {
  const districts = DISTRICTS_BY_CITY[citySlug.toLowerCase()];
  if (!districts) return null;

  // The outward code is everything before the space: "W1D 4SD" -> "W1D".
  const outward = postcode.trim().toUpperCase().match(/^([A-Z]{1,2}\d[A-Z\d]?)/)?.[1];
  if (!outward) return null;

  return districts[outward] ?? null;
}
