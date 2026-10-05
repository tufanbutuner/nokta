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
 *
 * Known limitation: a district is coarser than a neighbourhood, so several areas can collapse
 * into one name. Nottingham's NG7 covers Hyson Green, Radford, Forest Fields and Lenton, and
 * Glasgow's G1 covers both the city centre and Merchant City. The result is always a real
 * place, just a broader one than the venue's own neighbourhood — which only matters when the
 * district table is reached, i.e. when Google gave us no locality of its own. Splitting a
 * district needs the postcode sector (the digit after the space), which we do not store.
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

/**
 * Glasgow districts. G41/G42 (Pollokshields, Govanhill) hold most of the shisha trade, with
 * Finnieston and the West End for the bar-led venues.
 */
const GLASGOW_DISTRICTS: Record<string, string> = {
  G1: "City Centre", G2: "City Centre", G3: "Finnieston", G4: "Townhead",
  G5: "Gorbals", G11: "Partick", G12: "Hillhead", G13: "Knightswood",
  G14: "Whiteinch", G20: "Maryhill", G21: "Springburn", G22: "Possilpark",
  G31: "Dennistoun", G32: "Shettleston", G33: "Cranhill", G40: "Bridgeton",
  G41: "Pollokshields", G42: "Govanhill", G43: "Shawlands", G44: "Cathcart",
  G45: "Castlemilk", G46: "Giffnock", G51: "Govan", G52: "Cardonald",
  G53: "Pollok", G61: "Bearsden", G73: "Rutherglen",
};

/** Leeds districts. LS6 (Hyde Park, Headingley) and LS8/LS9 (Harehills) matter most here. */
const LEEDS_DISTRICTS: Record<string, string> = {
  LS1: "City Centre", LS2: "City Centre", LS3: "Burley", LS4: "Kirkstall",
  LS5: "Hawksworth", LS6: "Headingley", LS7: "Chapeltown", LS8: "Harehills",
  LS9: "Burmantofts", LS10: "Hunslet", LS11: "Beeston", LS12: "Armley",
  LS13: "Bramley", LS14: "Seacroft", LS15: "Cross Gates", LS16: "Adel",
  LS17: "Alwoodley", LS18: "Horsforth", LS19: "Yeadon", LS26: "Rothwell",
  LS27: "Morley", LS28: "Pudsey",
};

/** Bradford districts. BD8/BD9 cover Manningham and Girlington. */
const BRADFORD_DISTRICTS: Record<string, string> = {
  BD1: "City Centre", BD2: "Bolton", BD3: "Bradford Moor", BD4: "Tong",
  BD5: "Little Horton", BD6: "Wibsey", BD7: "Great Horton", BD8: "Manningham",
  BD9: "Heaton", BD10: "Idle", BD12: "Wyke", BD13: "Queensbury",
  BD14: "Clayton", BD15: "Allerton", BD16: "Bingley", BD17: "Baildon",
  BD18: "Shipley", BD21: "Keighley",
};

/** Sheffield districts. S2 (London Road) and S3/S4 (Burngreave) carry most venues. */
const SHEFFIELD_DISTRICTS: Record<string, string> = {
  S1: "City Centre", S2: "Highfield", S3: "Burngreave", S4: "Fir Vale",
  S5: "Firth Park", S6: "Hillsborough", S7: "Nether Edge", S8: "Woodseats",
  S9: "Attercliffe", S10: "Broomhill", S11: "Ecclesall", S12: "Gleadless",
  S13: "Woodhouse", S14: "Gleadless Valley", S17: "Dore", S20: "Beighton",
  S35: "Chapeltown", S36: "Stocksbridge",
};

/** Liverpool districts. L8 (Toxteth) and L7/L15 (Kensington, Wavertree) are the key ones. */
const LIVERPOOL_DISTRICTS: Record<string, string> = {
  L1: "City Centre", L2: "City Centre", L3: "City Centre", L4: "Walton",
  L5: "Everton", L6: "Fairfield", L7: "Kensington", L8: "Toxteth",
  L9: "Aintree", L11: "Norris Green", L12: "West Derby", L13: "Old Swan",
  L14: "Broadgreen", L15: "Wavertree", L16: "Childwall", L17: "Aigburth",
  L18: "Mossley Hill", L19: "Garston", L20: "Bootle", L21: "Litherland",
  L22: "Waterloo", L23: "Crosby", L24: "Speke", L25: "Woolton",
};

/** Nottingham districts. NG7 (Hyson Green, Radford, Lenton) dominates. */
const NOTTINGHAM_DISTRICTS: Record<string, string> = {
  NG1: "City Centre", NG2: "West Bridgford", NG3: "Sneinton", NG4: "Carlton",
  NG5: "Sherwood", NG6: "Bulwell", NG7: "Hyson Green", NG8: "Bilborough",
  NG9: "Beeston", NG10: "Long Eaton", NG11: "Clifton", NG16: "Eastwood",
  NG17: "Sutton-in-Ashfield",
};

/** Per-city tables, keyed by the slug used in SUPPORTED_CITIES. */
const DISTRICTS_BY_CITY: Record<string, Record<string, string>> = {
  london: LONDON_DISTRICTS,
  birmingham: BIRMINGHAM_DISTRICTS,
  manchester: MANCHESTER_DISTRICTS,
  leicester: LEICESTER_DISTRICTS,
  glasgow: GLASGOW_DISTRICTS,
  leeds: LEEDS_DISTRICTS,
  bradford: BRADFORD_DISTRICTS,
  sheffield: SHEFFIELD_DISTRICTS,
  liverpool: LIVERPOOL_DISTRICTS,
  nottingham: NOTTINGHAM_DISTRICTS,
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
