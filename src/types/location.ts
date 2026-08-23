export interface UserLocation {
  latitude: number;
  longitude: number;
  label?: string;
  source?: LocationSource;
}

export type LocationStatus = "idle" | "loading" | "success" | "error" | "denied" | "unsupported";
export type LocationSource = "browser" | "manual";

export interface SavedUserLocation {
  label: string;
  coordinates: UserLocation | null;
  source: LocationSource;
  updatedAt: string;
}
