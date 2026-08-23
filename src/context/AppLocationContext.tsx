import { createContext, useContext, useMemo, useState } from "react";
import { resolveManualLocation } from "@/lib/manualLocation";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";
import type { LocationStatus, SavedUserLocation, UserLocation } from "@/types/location";

interface AppLocationContextValue {
  savedLocation: SavedUserLocation | null;
  userLocation: UserLocation | null;
  locationStatus: LocationStatus;
  hasCoordinates: boolean;
  setManualLocation: (label: string) => Promise<void>;
  useCurrentLocation: () => void;
  clearLocation: () => void;
}

const STORAGE_KEY = "sheesha:user-location";
const AppLocationContext = createContext<AppLocationContextValue | undefined>(undefined);

export function AppLocationProvider({ children }: { children: React.ReactNode }) {
  const [savedLocation, setSavedLocationState] = useState<SavedUserLocation | null>(() => readJsonFromStorage<SavedUserLocation | null>(STORAGE_KEY, null));
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(savedLocation ? "success" : "idle");

  const userLocation = savedLocation?.coordinates ?? null;
  const hasCoordinates = Boolean(userLocation);

  function persistLocation(location: SavedUserLocation | null) {
    setSavedLocationState(location);
    writeJsonToStorage(STORAGE_KEY, location);
  }

  async function setManualLocation(label: string) {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      clearLocation();
      return;
    }

    setLocationStatus("loading");
    const coordinates = await resolveManualLocation(trimmedLabel);
    persistLocation({
      label: coordinates?.label ?? trimmedLabel,
      coordinates,
      source: "manual",
      updatedAt: new Date().toISOString(),
    });
    setLocationStatus("success");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        persistLocation({
          label: "Current location",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            label: "Current location",
            source: "browser",
          },
          source: "browser",
          updatedAt: new Date().toISOString(),
        });
        setLocationStatus("success");
      },
      (error) => {
        setLocationStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  function clearLocation() {
    persistLocation(null);
    setLocationStatus("idle");
  }

  const value = useMemo(
    () => ({
      savedLocation,
      userLocation,
      locationStatus,
      hasCoordinates,
      setManualLocation,
      useCurrentLocation,
      clearLocation,
    }),
    [savedLocation, userLocation, locationStatus, hasCoordinates],
  );

  return <AppLocationContext.Provider value={value}>{children}</AppLocationContext.Provider>;
}

export function useAppLocation() {
  const context = useContext(AppLocationContext);
  if (!context) {
    throw new Error("useAppLocation must be used within AppLocationProvider");
  }

  return context;
}
