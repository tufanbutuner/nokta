import { AppLayout } from "@/components/layout/AppLayout";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { VenuePage } from "@/pages/VenuePage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/discover", element: <DiscoverPage /> },
      { path: "/venues/:slug", element: <VenuePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
