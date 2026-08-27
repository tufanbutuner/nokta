import posthog from "posthog-js";

let posthogInitialised = false;

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key || posthogInitialised) return;

  posthog.init(key, {
    api_host: host || "https://eu.i.posthog.com",
    capture_pageview: false,
    autocapture: false,
    loaded: () => {
      posthogInitialised = true;
    },
  });
}

export function capturePostHogEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!posthogInitialised) return;
  posthog.capture(eventName, properties);
}

export function capturePostHogPageView(path: string) {
  if (!posthogInitialised) return;
  posthog.capture("$pageview", { path });
}
