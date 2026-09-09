import { RouteAnalytics } from "@/components/analytics/RouteAnalytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const { pathname } = useLocation();
  const isWorkspaceRoute = pathname.startsWith("/admin") || pathname.startsWith("/owner");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <>
      <RouteAnalytics />
      {isWorkspaceRoute ? null : <Header />}
      <Outlet />
      {isWorkspaceRoute ? null : <Footer />}
    </>
  );
}
