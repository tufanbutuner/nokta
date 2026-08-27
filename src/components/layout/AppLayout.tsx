import { RouteAnalytics } from "@/components/analytics/RouteAnalytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <>
      <RouteAnalytics />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
