import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { RouteErrorState } from "@/components/state/RouteErrorState";

export function AppErrorPage() {
  const error = useRouteError();
  const routeError = isRouteErrorResponse(error) ? error : null;
  const title = routeError?.status === 404 ? "Page not found" : "Something went wrong";
  const description = routeError?.status === 404 ? "That page is not available anymore." : "We hit a problem loading this page. Try again, or head back to Discover.";
  const devDetail = import.meta.env.DEV ? getErrorDetail(error) : null;

  return <RouteErrorState title={title} description={description} devDetail={devDetail} />;
}

function getErrorDetail(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
}
