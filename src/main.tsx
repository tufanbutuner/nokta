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
import { getModelContext } from "@/lib/webMcpSupport";
import "@/styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

initPostHog();

// WebMCP tools for AI agents. Only browsers with WebMCP download the search code.
if (getModelContext()) void import("@/services/webMcpService").then(({ startWebMcp }) => startWebMcp());

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
