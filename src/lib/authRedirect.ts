/**
 * Where to send someone after they sign in. Only same-origin paths are allowed,
 * so a crafted `?redirect=https://evil.example` link cannot bounce a fresh
 * session off-site. `//host` and `/\host` are protocol-relative in browsers and
 * are rejected for the same reason.
 */
export function getSafeRedirect(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Appends `?redirect=` to an auth route, leaving the default destination implicit. */
export function withRedirect(path: string, redirect: string | null | undefined) {
  const safe = getSafeRedirect(redirect, "");
  if (!safe || safe === "/account") return path;
  return `${path}?redirect=${encodeURIComponent(safe)}`;
}
