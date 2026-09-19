import posthog from "posthog-js";
import { getAnalyticsEnvironment, isProductionAnalytics } from "@/lib/analyticsEnvironment";

let posthogInitialised = false;

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key || posthogInitialised) return;

  /**
   * Local and preview traffic never reaches PostHog. Tagging it and filtering in
   * the UI would work, but not sending is better: test sessions stop consuming
   * event and recording quota, and every chart is right by default rather than
   * right only when someone remembers the filter.
   *
   * VITE_ANALYTICS_ENV=production forces it on, which is how you verify the
   * integration from a local build without shipping.
   */
  if (!isProductionAnalytics()) {
    if (import.meta.env.DEV) {
      console.info("[posthog] disabled outside production —", getAnalyticsEnvironment());
    }
    return;
  }

  posthog.init(key, {
    api_host: host || "https://eu.i.posthog.com",
    capture_pageview: false,
    autocapture: false,
    loaded: () => {
      posthogInitialised = true;
      // Stamped on every event, so PostHog agrees with the Supabase side.
      posthog.register({ environment: getAnalyticsEnvironment() });
    },
  });
}

export function capturePostHogEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!posthogInitialised) return;
  posthog.capture(eventName, properties);
}

/**
 * `capture_pageview: false` means posthog-js attaches no URL properties of its
 * own, and PostHog's own path breakdowns and web analytics views read
 * `$current_url` rather than a custom property. Sending it keeps those working;
 * `path` and `route_pattern` are what our own funnels are built on.
 */
export function capturePostHogPageView(path: string, routePattern?: string) {
  if (!posthogInitialised) return;
  posthog.capture("$pageview", {
    path,
    route_pattern: routePattern,
    $current_url: window.location.href,
  });
}

/**
 * Ties the anonymous history that led up to a sign-in to the account itself, so
 * a signup and the activity after it are one person rather than two.
 *
 * Only the account id and email are sent. Nothing else about a user belongs in
 * an analytics profile.
 */
export function identifyPostHogUser(userId: string, email?: string | null) {
  if (!posthogInitialised) return;
  posthog.identify(userId, email ? { email } : undefined);
}

/** Signing out starts a fresh anonymous identity, so a shared device does not merge two people. */
export function resetPostHogUser() {
  if (!posthogInitialised) return;
  posthog.reset();
}
