import type { UserLocation } from "@/types/location";

const FULL_UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const LONDON_AREAS: Record<string, UserLocation> = {
  bermondsey: { latitude: 51.4979, longitude: -0.0637 },
  "canary wharf": { latitude: 51.5054, longitude: -0.0235 },
  chelsea: { latitude: 51.4875, longitude: -0.1687 },
  dalston: { latitude: 51.545, longitude: -0.0744 },
  ealing: { latitude: 51.513, longitude: -0.3089 },
  "edgware road": { latitude: 51.5195, longitude: -0.1661 },
  hackney: { latitude: 51.545, longitude: -0.0553 },
  holborn: { latitude: 51.5172, longitude: -0.1182 },
  "king's cross": { latitude: 51.5308, longitude: -0.1238 },
  kingscross: { latitude: 51.5308, longitude: -0.1238 },
  knightsbridge: { latitude: 51.499, longitude: -0.163 },
  mayfair: { latitude: 51.5116, longitude: -0.1478 },
  paddington: { latitude: 51.5154, longitude: -0.1755 },
  shoreditch: { latitude: 51.5255, longitude: -0.0771 },
  soho: { latitude: 51.5136, longitude: -0.1365 },
  stratford: { latitude: 51.5413, longitude: -0.0034 },
  wembley: { latitude: 51.5588, longitude: -0.2817 },
  westminster: { latitude: 51.4975, longitude: -0.1357 },
};

interface PostcodesIoResponse {
  status: number;
  result?: {
    latitude?: number;
    longitude?: number;
    postcode?: string;
  } | null;
}

export async function resolveManualLocation(input: string): Promise<UserLocation | null> {
  const label = input.trim();
  if (!label) {
    return null;
  }

  const areaMatch = LONDON_AREAS[label.toLowerCase()];
  if (areaMatch) {
    return {
      ...areaMatch,
      label,
      source: "manual",
    };
  }

  if (!FULL_UK_POSTCODE_PATTERN.test(label)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(label)}`);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PostcodesIoResponse;
    const latitude = data.result?.latitude;
    const longitude = data.result?.longitude;

    if (typeof latitude !== "number" || typeof longitude !== "number" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      label: data.result?.postcode ?? label,
      source: "manual",
    };
  } catch {
    return null;
  }
}
