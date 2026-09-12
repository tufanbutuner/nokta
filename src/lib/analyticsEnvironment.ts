export type AnalyticsEnvironment = "production" | "preview" | "development";

/**
 * Which environment analytics events should be recorded against.
 *
 * Reporting counts 'production' only, so this is the single thing keeping local
 * and preview browsing out of a venue's numbers. It is derived rather than
 * configured by hand: anything that is not a production build is treated as
 * non-production, so forgetting to set a variable fails safe — the worst case is
 * that real traffic goes uncounted, never that test traffic is counted as real.
 *
 * VITE_ANALYTICS_ENV overrides it, which is what a preview deployment sets.
 */
export function getAnalyticsEnvironment(): AnalyticsEnvironment {
  const configured = import.meta.env.VITE_ANALYTICS_ENV as string | undefined;
  if (configured === "production" || configured === "preview" || configured === "development") {
    return configured;
  }

  // Vercel exposes this on preview and production deployments alike.
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV as string | undefined;
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";

  return import.meta.env.PROD ? "production" : "development";
}

/** True only where events should count as real traffic. */
export function isProductionAnalytics(): boolean {
  return getAnalyticsEnvironment() === "production";
}
