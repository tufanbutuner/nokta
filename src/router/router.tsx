import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccountPage } from "@/pages/AccountPage";
import { DataQualityPage } from "@/pages/admin/DataQualityPage";
import { AdminReviewsPage } from "@/pages/admin/AdminReviewsPage";
import { AdminVenueSuggestionsPage } from "@/pages/admin/AdminVenueSuggestionsPage";
import { AdminVenuesPage } from "@/pages/admin/AdminVenuesPage";
import { VenueFormPage } from "@/pages/admin/VenueFormPage";
import { AppErrorPage } from "@/pages/AppErrorPage";
import { AppErrorPreviewPage } from "@/pages/AppErrorPreviewPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { HomePage } from "@/pages/HomePage";
import { MonetisationDashboardPage } from "@/pages/admin/MonetisationDashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { RecommendPage } from "@/pages/RecommendPage";
import { SavedPage } from "@/pages/SavedPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { SuggestVenuePage } from "@/pages/SuggestVenuePage";
import { TermsPage } from "@/pages/TermsPage";
import { VenuePage } from "@/pages/VenuePage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <AppErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/discover", element: <DiscoverPage /> },
      { path: "/recommend", element: <RecommendPage /> },
      { path: "/saved", element: <SavedPage /> },
      { path: "/suggest", element: <SuggestVenuePage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
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
      ...(import.meta.env.DEV ? [{ path: "/error-boundary-preview", element: <AppErrorPreviewPage /> }] : []),
      {
        path: "/admin/data-quality",
        element: (
          <RequireAdmin>
            <DataQualityPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/venues",
        element: (
          <RequireAdmin>
            <AdminVenuesPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/reviews",
        element: (
          <RequireAdmin>
            <AdminReviewsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/suggestions",
        element: (
          <RequireAdmin>
            <AdminVenueSuggestionsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/monetisation",
        element: (
          <RequireAdmin>
            <MonetisationDashboardPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/venues/new",
        element: (
          <RequireAdmin>
            <VenueFormPage mode="new" />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/venues/:id/edit",
        element: (
          <RequireAdmin>
            <VenueFormPage mode="edit" />
          </RequireAdmin>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
