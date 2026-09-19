import { useEffect, useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";
import { routes } from "@/router/router";

/**
 * The raw path carries query strings and resolved params, so `/venues/abc` and
 * `/discover?q=shisha` are each their own value. Useful for reading a single
 * session, useless as a breakdown: a funnel keyed on it never groups.
 *
 * So we send the route pattern alongside it. `/venues/:slug` is one value across
 * every venue, which is the dimension a funnel step actually wants.
 */
function resolveRoutePattern(pathname: string): string | undefined {
  const matches = matchRoutes(routes, pathname);
  if (!matches?.length) return undefined;

  const pattern = matches
    .map((match) => match.route.path)
    .filter((path): path is string => Boolean(path) && path !== "/")
    .join("");

  return pattern || "/";
}

export function RouteAnalytics() {
  const location = useLocation();
  const routePattern = useMemo(() => resolveRoutePattern(location.pathname), [location.pathname]);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`, routePattern);
  }, [location.pathname, location.search, routePattern]);

  return null;
}
