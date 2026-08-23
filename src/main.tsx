import { AuthProvider } from "@/context/AuthContext";
import { AppLocationProvider } from "@/context/AppLocationContext";
import { VenuePreferencesProvider } from "@/context/VenuePreferencesContext";
import { router } from "@/router/router";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import "@/styles.css";
import "leaflet/dist/leaflet.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppLocationProvider>
        <VenuePreferencesProvider>
          <RouterProvider router={router} />
          <VercelAnalytics />
        </VenuePreferencesProvider>
      </AppLocationProvider>
    </AuthProvider>
  </React.StrictMode>,
);
