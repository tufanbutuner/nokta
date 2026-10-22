import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLocationProvider } from "@/context/AppLocationContext";
import { VenuePreferencesProvider } from "@/context/VenuePreferencesContext";
import { router } from "@/router/router";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import { VercelSpeedInsights } from "@/components/analytics/VercelSpeedInsights";
import { AppErrorBoundary } from "@/components/state/AppErrorBoundary";
import { initPostHog } from "@/lib/posthogClient";
import { queryClient } from "@/lib/queryClient";
import { getVenues } from "@/services/venueService";
import "@/styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

initPostHog();

// Start the venue list request alongside the route chunk so the first card image is not
// queued behind lazy-loading and auth restore. useVenues reads the same cache entry.
if (window.location.pathname === "/" || window.location.pathname.startsWith("/cities/")) {
  void queryClient.prefetchQuery({ queryKey: ["venues"], queryFn: getVenues });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppLocationProvider>
                <VenuePreferencesProvider>
                  <RouterProvider router={router} />
                  <VercelAnalytics />
                  <VercelSpeedInsights />
                </VenuePreferencesProvider>
              </AppLocationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </AppErrorBoundary>
      </HelmetProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
