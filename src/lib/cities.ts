import { SUPPORTED_CITIES } from "@/data/supportedCities";
import type { SupportedCity } from "@/types/city";

export const DEFAULT_COUNTRY = "United Kingdom";
export const DEFAULT_CITY = "London";

export function getActiveCities(): SupportedCity[] {
  return SUPPORTED_CITIES.filter((city) => city.isActive);
}

export function getCityBySlug(slug: string): SupportedCity | undefined {
  return SUPPORTED_CITIES.find((city) => city.slug === slug);
}

export function getCityByName(name: string): SupportedCity | undefined {
  return SUPPORTED_CITIES.find((city) => city.name.toLowerCase() === name.trim().toLowerCase());
}

export function createCitySlug(cityName: string): string {
  return cityName
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCityOptions({ activeOnly = true } = {}) {
  const cities = activeOnly ? getActiveCities() : SUPPORTED_CITIES;
  return cities.map((city) => ({ label: activeOnly || city.isActive ? city.name : `${city.name} coming soon`, value: city.name }));
}
