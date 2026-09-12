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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <>
      <RouteAnalytics />
      {hideSiteChrome ? null : <Header />}
      <Outlet />
      {hideSiteChrome ? null : <Footer />}
    </>
  );
}
