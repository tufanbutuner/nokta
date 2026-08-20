import { AppLayout } from "@/components/layout/AppLayout";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RecommendPage } from "@/pages/RecommendPage";
import { SavedPage } from "@/pages/SavedPage";
import { VenuePage } from "@/pages/VenuePage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/discover", element: <DiscoverPage /> },
      { path: "/recommend", element: <RecommendPage /> },
      { path: "/saved", element: <SavedPage /> },
      { path: "/venues/:slug", element: <VenuePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
