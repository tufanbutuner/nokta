import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
