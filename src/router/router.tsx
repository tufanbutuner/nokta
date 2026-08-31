import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccountPage } from "@/pages/AccountPage";
import { MyBookingsPage } from "@/pages/account/MyBookingsPage";
import { NotificationsPage } from "@/pages/account/NotificationsPage";
import { DataQualityPage } from "@/pages/admin/DataQualityPage";
import { AdminFeaturedPlacementsPage } from "@/pages/admin/AdminFeaturedPlacementsPage";
import { AdminMediaReviewPage } from "@/pages/admin/AdminMediaReviewPage";
import { AdminReviewsPage } from "@/pages/admin/AdminReviewsPage";
import { AdminPromotedOffersPage } from "@/pages/admin/AdminPromotedOffersPage";
import { AdminPromotionRequestsPage } from "@/pages/admin/AdminPromotionRequestsPage";
import { AdminVenueAnalyticsPage } from "@/pages/admin/AdminVenueAnalyticsPage";
import { AdminVenueUpdateRequestsPage } from "@/pages/admin/AdminVenueUpdateRequestsPage";
import { AdminSubscriptionsPage } from "@/pages/admin/AdminSubscriptionsPage";
import { AdminBookingRequestsPage } from "@/pages/admin/AdminBookingRequestsPage";
import { AdminVenueEnquiriesPage } from "@/pages/admin/AdminVenueEnquiriesPage";
import { AdminVenueClaimsPage } from "@/pages/admin/AdminVenueClaimsPage";
import { AdminVenueSuggestionsPage } from "@/pages/admin/AdminVenueSuggestionsPage";
import { AdminVenuesPage } from "@/pages/admin/AdminVenuesPage";
import { VenueFormPage } from "@/pages/admin/VenueFormPage";
import { AppErrorPage } from "@/pages/AppErrorPage";
import { AppErrorPreviewPage } from "@/pages/AppErrorPreviewPage";
import { ClaimVenuePage } from "@/pages/ClaimVenuePage";
import { CityPage } from "@/pages/CityPage";
import { CustomerBookingStatusPage } from "@/pages/CustomerBookingStatusPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { HomePage } from "@/pages/HomePage";
import { MonetisationDashboardPage } from "@/pages/admin/MonetisationDashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OwnerDashboardPage } from "@/pages/owner/OwnerDashboardPage";
import { OwnerBillingPage } from "@/pages/owner/OwnerBillingPage";
import { OwnerBillingSuccessPage } from "@/pages/owner/OwnerBillingSuccessPage";
import { OwnerBookingsPage } from "@/pages/owner/OwnerBookingsPage";
import { OwnerEnquiriesPage } from "@/pages/owner/OwnerEnquiriesPage";
import { OwnerVenueDashboardPage } from "@/pages/owner/OwnerVenueDashboardPage";
import { OwnerVenueEnquiriesPage } from "@/pages/owner/OwnerVenueEnquiriesPage";
import { OwnerVenueAvailabilityPage } from "@/pages/owner/OwnerVenueAvailabilityPage";
import { OwnerVenueMediaPage } from "@/pages/owner/OwnerVenueMediaPage";
import { OwnerVenueUpdateRequestPage } from "@/pages/owner/OwnerVenueUpdateRequestPage";
import { OwnerPricingPage } from "@/pages/owner/OwnerPricingPage";
import { OwnerPromotionsPage } from "@/pages/owner/OwnerPromotionsPage";
import { OwnerRequestFeaturedPlacementPage } from "@/pages/owner/OwnerRequestFeaturedPlacementPage";
import { OwnerRequestPromotedOfferPage } from "@/pages/owner/OwnerRequestPromotedOfferPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { PromotedOfferPreviewPage } from "@/pages/PromotedOfferPreviewPage";
import { RecommendPage } from "@/pages/RecommendPage";
import { RequestBookingPage } from "@/pages/RequestBookingPage";
import { SavedPage } from "@/pages/SavedPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { SuggestVenuePage } from "@/pages/SuggestVenuePage";
import { TermsPage } from "@/pages/TermsPage";
import { VenueEnquiryPage } from "@/pages/VenueEnquiryPage";
import { VenuePage } from "@/pages/VenuePage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <AppErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/discover", element: <DiscoverPage /> },
      { path: "/cities/:citySlug", element: <CityPage /> },
      { path: "/recommend", element: <RecommendPage /> },
      { path: "/saved", element: <SavedPage /> },
      { path: "/suggest", element: <SuggestVenuePage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
      {
        path: "/owner/bookings",
        element: (
          <RequireAuth>
            <OwnerBookingsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/account",
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: "/account/bookings",
        element: (
          <RequireAuth>
            <MyBookingsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/account/notifications",
        element: (
          <RequireAuth>
            <NotificationsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/bookings",
        element: (
          <RequireAuth>
            <OwnerBookingsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner",
        element: (
          <RequireAuth>
            <OwnerDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues",
        element: (
          <RequireAuth>
            <OwnerDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/enquiries",
        element: (
          <RequireAuth>
            <OwnerEnquiriesPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/promotions",
        element: (
          <RequireAuth>
            <OwnerPromotionsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId",
        element: (
          <RequireAuth>
            <OwnerVenueDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/enquiries",
        element: (
          <RequireAuth>
            <OwnerVenueEnquiriesPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/media",
        element: (
          <RequireAuth>
            <OwnerVenueMediaPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/availability",
        element: (
          <RequireAuth>
            <OwnerVenueAvailabilityPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/update",
        element: (
          <RequireAuth>
            <OwnerVenueUpdateRequestPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/promotions/offers/new",
        element: (
          <RequireAuth>
            <OwnerRequestPromotedOfferPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/venues/:venueId/promotions/featured/new",
        element: (
          <RequireAuth>
            <OwnerRequestFeaturedPlacementPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/pricing",
        element: (
          <RequireAuth>
            <OwnerPricingPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/billing",
        element: (
          <RequireAuth>
            <OwnerBillingPage />
          </RequireAuth>
        ),
      },
      {
        path: "/owner/billing/success",
        element: (
          <RequireAuth>
            <OwnerBillingSuccessPage />
          </RequireAuth>
        ),
      },
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
      { path: "/venues/:slug/claim", element: <ClaimVenuePage /> },
      { path: "/venues/:slug/request-booking", element: <RequestBookingPage /> },
      { path: "/booking-status/:token", element: <CustomerBookingStatusPage /> },
      { path: "/venues/:slug/enquire", element: <VenueEnquiryPage /> },
      { path: "/venues/:slug", element: <VenuePage /> },
      ...(import.meta.env.DEV
        ? [
            { path: "/error-boundary-preview", element: <AppErrorPreviewPage /> },
            { path: "/promoted-offer-preview", element: <PromotedOfferPreviewPage /> },
          ]
        : []),
      {
        path: "/admin/bookings",
        element: (
          <RequireAdmin>
            <AdminBookingRequestsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/data-quality",
        element: (
          <RequireAdmin>
            <DataQualityPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/venue-updates",
        element: (
          <RequireAdmin>
            <AdminVenueUpdateRequestsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/media-review",
        element: (
          <RequireAdmin>
            <AdminMediaReviewPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/subscriptions",
        element: (
          <RequireAdmin>
            <AdminSubscriptionsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/promotion-requests",
        element: (
          <RequireAdmin>
            <AdminPromotionRequestsPage />
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
        path: "/admin/claims",
        element: (
          <RequireAdmin>
            <AdminVenueClaimsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/featured",
        element: (
          <RequireAdmin>
            <AdminFeaturedPlacementsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/enquiries",
        element: (
          <RequireAdmin>
            <AdminVenueEnquiriesPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/offers",
        element: (
          <RequireAdmin>
            <AdminPromotedOffersPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/analytics",
        element: (
          <RequireAdmin>
            <AdminVenueAnalyticsPage />
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
