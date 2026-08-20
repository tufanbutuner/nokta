export interface UserLocation {
  latitude: number;
  longitude: number;
}

export type LocationStatus = "idle" | "loading" | "success" | "error" | "denied" | "unsupported";
