/// <reference types="node" />

/**
 * Works out which neighbourhood a venue sits in.
 *
 * The first version of this read `formattedAddress` and took the comma-separated part before
 * "London", which returns the street line for any address that has no neighbourhood in it —
 * 64 of the first 77 London venues came out as things like "45 Frith St". Area is a browsable
 * filter and an analytics dimension, so a street address there is a broken facet rather than
 * untidy data.
 *
 * Google already knows the answer, in `addressComponents`. This reads that, most specific
 * first, and only falls back to text parsing when the components are missing.
 */

import { areaFromPostcode } from "./postcodeAreas";

export type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

/**
 * Component types that name a neighbourhood, most specific first. `sublocality_level_1` is the
 * London borough-ish one ("Soho", "Shoreditch"); `postal_town` is the fallback for smaller
 * cities where Google records no sublocality at all.
 */
const AREA_COMPONENT_TYPES = [
  "neighborhood",
  "sublocality_level_1",
  "sublocality",
  "postal_town",
];

/**
 * Words that end a street line rather than a neighbourhood name. Checked against the LAST word
 * only: "Terrace Road" is a street, while "Garden Terrace" and "Jewellery Quarter" are areas
 * people really do search for, so a word appearing anywhere is too blunt a test.
 */
const STREET_SUFFIXES = new Set([
  "st", "street", "rd", "road", "ave", "avenue", "ln", "lane", "way", "close", "cl",
  "dr", "drive", "pl", "place", "sq", "square", "row", "parade", "broadway", "walk",
  "crescent", "cres", "grove", "mews", "embankment", "bridge", "hwy", "highway",
]);

export function resolveArea(input: {
  addressComponents?: AddressComponent[];
  formattedAddress?: string;
  cityName: string;
  /** The area term used in the search query, as a last resort — we at least searched for it. */
  queriedArea?: string;
  /** Registry slug, for the postcode-district lookup. */
  citySlug?: string;
  /** Already-extracted postcode, if the caller has one. */
  postcode?: string;
}): string {
  const fromComponents = areaFromComponents(input.addressComponents, input.cityName);
  if (fromComponents) return fromComponents;

  const fromAddress = areaFromAddress(input.formattedAddress ?? "", input.cityName);
  if (fromAddress) return fromAddress;

  // The postcode district outranks the queried area. The query only records where we looked:
  // a venue in SE10 found through the "Shoreditch" search is in Greenwich, not Shoreditch, and
  // trusting the query mislabelled 20+ venues that way. The district is hard evidence.
  if (input.citySlug) {
    const postcode = input.postcode ?? getPostcodeFrom(input.formattedAddress ?? "");
    const fromDistrict = postcode ? areaFromPostcode(postcode, input.citySlug) : null;
    if (fromDistrict) return fromDistrict;
  }

  // Only now fall back to the search term, for a city with no district table yet.
  if (input.queriedArea && !isStreetLike(input.queriedArea) && !isCityWideTerm(input.queriedArea, input.cityName)) {
    return stripCitySuffix(input.queriedArea, input.cityName);
  }

  return input.cityName;
}

function areaFromComponents(components: AddressComponent[] | undefined, cityName: string) {
  if (!components?.length) return null;

  for (const type of AREA_COMPONENT_TYPES) {
    const match = components.find((component) => component.types?.includes(type));
    const value = match?.longText?.trim();
    if (!value) continue;
    // `postal_town` is usually the city itself; that is not an area, so keep looking.
    if (isSameCity(value, cityName)) continue;
    if (isStreetLike(value)) continue;
    if (isAddressFragment(value)) continue;
    return value;
  }

  return null;
}

function areaFromAddress(address: string, cityName: string) {
  if (!address) return null;

  const postcode = address.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0] ?? "";
  const parts = address
    .replace(/,?\s*UK$/i, "")
    .split(",")
    .map((part) => part.replace(postcode, "").trim())
    .filter(Boolean);

  // Walk back from the end, past the city, looking for the first part that reads like an area.
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (!part) continue;
    if (isSameCity(part, cityName)) continue;
    if (isStreetLike(part)) continue;
    // The components path rejects address fragments; this path must too, or a "Unit 1," in the
    // address line becomes the area.
    if (isAddressFragment(part)) continue;
    // A London address often reads "Soho, London W1D" — the part before the city is the area.
    return part;
  }

  return null;
}

/**
 * True for registry search terms that cover a whole city rather than naming one neighbourhood.
 * These are useful as queries but meaningless as an area label.
 */
function isCityWideTerm(value: string, cityName: string) {
  // The city name can lead or trail the term: "Central London", "Manchester City Centre".
  const city = cityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalised = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(new RegExp(`(^${city}\\s+|\\s+${city}$)`, "g"), "")
    .trim();
  if (!normalised || normalised === city) return true;
  return /^(central|city centre|city center|centre|center|downtown|town centre|city)$/.test(normalised);
}

/**
 * True when a value names the city rather than an area within it. Stripping the postcode can
 * leave a district letter group behind ("Manchester M14"), which is still the city, not an area.
 */
function isSameCity(value: string, cityName: string) {
  const normalised = value
    .trim()
    .replace(/\s+[A-Z]{1,2}\d[A-Z\d]?$/i, "")
    .trim()
    .toLowerCase();
  return normalised === cityName.trim().toLowerCase();
}

/**
 * Google sometimes returns part of the address line as a locality, e.g. "Rear of" from
 * "Dune lounge, Rear of, 204 Lea Bridge Rd". It reads like an area but names no place.
 */
export function isAddressFragment(value: string) {
  const trimmed = value.trim();
  // A leading "unit"/"flat"/etc. is a fragment whether or not more text follows it, so
  // "Unit 14 Piccadilly" and "unit 13T" are caught as well as a bare "Unit 6".
  if (/^(rear of|front of|unit|flat|suite|floor|basement|ground floor|opposite|next to|behind|above|below|c\/o)\b/i.test(trimmed)) return true;
  // A single word that only qualifies a place name ("Greater", as in Greater Manchester) or
  // repeats the category ("Shisha") is a sliced address line, not a neighbourhood.
  if (/^(greater|central|north|south|east|west|upper|lower|inner|outer|shisha|hookah|lounge|cafe|restaurant|bar)$/i.test(trimmed)) return true;
  // A named building, estate or business park is a premises, not an area: "Waverley House",
  // "Adco Business Centre". Google returns these as localities for venues inside them.
  // "City Centre" is excluded by name: it is the one "centre" that IS an area, and several
  // city tables produce it deliberately.
  if (!/^city (centre|center)$/i.test(trimmed)) {
    if (/\b(house|court|business centre|business center|business park|retail park|industrial estate|mill|works|chambers|buildings?|arcade|plaza|tower|block)$/i.test(trimmed)) return true;
  }
  // A student-accommodation or serviced-office operator name, returned as a locality for a
  // venue in its building.
  if (/^(unite|ibis|premier inn|travelodge|regus|wework)$/i.test(trimmed)) return true;
  // A lowercase first letter means a sliced address line, never a place name: "yellow doors".
  return /^[a-z]/.test(trimmed);
}

/** True for anything that looks like a street line rather than a neighbourhood. */
export function isStreetLike(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  // A leading building number is the clearest signal: "45 Frith St", "9 Camden High St".
  if (/^\d/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase().replace(/\.$/, "") ?? "";
  return STREET_SUFFIXES.has(lastWord);
}

/** "Soho London" -> "Soho", so registry area terms can carry the city for better search hits. */
export function stripCitySuffix(value: string, cityName: string) {
  return value.replace(new RegExp(`\\s+${cityName}$`, "i"), "").trim() || value;
}

/** Pulls a UK postcode out of a free-text address. */
function getPostcodeFrom(address: string) {
  return address.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0]?.toUpperCase() ?? "";
}
