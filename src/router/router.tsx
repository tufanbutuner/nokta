import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccountPage } from "@/pages/AccountPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RecommendPage } from "@/pages/RecommendPage";
import { SavedPage } from "@/pages/SavedPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
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
      {
        path: "/account",
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
      { path: "/venues/:slug", element: <VenuePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
