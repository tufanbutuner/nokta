import { createContext, type PropsWithChildren, useContext } from "react";
import { useVenuePreferencesState, type UseVenuePreferencesResult } from "@/hooks/useVenuePreferences";

const VenuePreferencesContext = createContext<UseVenuePreferencesResult | null>(null);

export function VenuePreferencesProvider({ children }: PropsWithChildren) {
  const preferences = useVenuePreferencesState();

  return <VenuePreferencesContext.Provider value={preferences}>{children}</VenuePreferencesContext.Provider>;
}

export function useVenuePreferences() {
  const context = useContext(VenuePreferencesContext);

  if (!context) {
    throw new Error("useVenuePreferences must be used within VenuePreferencesProvider");
  }

  return context;
}
