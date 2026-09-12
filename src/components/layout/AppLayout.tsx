import { RouteAnalytics } from "@/components/analytics/RouteAnalytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const { pathname } = useLocation();
  // Workspaces bring their own shell; the recommend flow and shared shortlists own
  // the whole viewport with their own dark chrome. Both would fight the site header.
  const hideSiteChrome = pathname.startsWith("/admin") || pathname.startsWith("/owner") || pathname === "/recommend" || pathname.startsWith("/s/");
  const isDarkCanvas = pathname === "/recommend" || pathname.startsWith("/s/");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  // The dark routes cover the viewport exactly, so the page's own cream body
  // shows only where the browser overscrolls past it. Paint it to match.
  useEffect(() => {
    if (!isDarkCanvas) return;
    const { body } = document;
    const previous = body.style.backgroundColor;
    body.style.backgroundColor = "#141312";
    return () => {
      body.style.backgroundColor = previous;
    };
  }, [isDarkCanvas]);

  return (
    <>
      <RouteAnalytics />
      {hideSiteChrome ? null : <Header />}
      <Outlet />
      {hideSiteChrome ? null : <Footer />}
    </>
  );
}
