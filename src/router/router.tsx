import { Suspense, lazy, type ComponentType, type ReactElement } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoadingState } from "@/components/state/PageLoadingState";
import { AppErrorPage } from "@/pages/AppErrorPage";
import { createBrowserRouter, useSearchParams } from "react-router-dom";

const AccountConfirmationPage = lazyPage(() => import("@/pages/AccountConfirmationPage"), "AccountConfirmationPage");
const AccountPage = lazyPage(() => import("@/pages/AccountPage"), "AccountPage");
const MyBookingsPage = lazyPage(() => import("@/pages/account/MyBookingsPage"), "MyBookingsPage");
const NotificationsPage = lazyPage(() => import("@/pages/account/NotificationsPage"), "NotificationsPage");
const DataQualityPage = lazyPage(() => import("@/pages/admin/DataQualityPage"), "DataQualityPage");
const AdminFeaturedPlacementsPage = lazyPage(() => import("@/pages/admin/AdminFeaturedPlacementsPage"), "AdminFeaturedPlacementsPage");
const AdminMediaReviewPage = lazyPage(() => import("@/pages/admin/AdminMediaReviewPage"), "AdminMediaReviewPage");
const AdminReviewsPage = lazyPage(() => import("@/pages/admin/AdminReviewsPage"), "AdminReviewsPage");
const AdminPromotedOffersPage = lazyPage(() => import("@/pages/admin/AdminPromotedOffersPage"), "AdminPromotedOffersPage");
const AdminPromotionRequestsPage = lazyPage(() => import("@/pages/admin/AdminPromotionRequestsPage"), "AdminPromotionRequestsPage");
const AdminVenueAnalyticsPage = lazyPage(() => import("@/pages/admin/AdminVenueAnalyticsPage"), "AdminVenueAnalyticsPage");
const AdminVenueUpdateRequestsPage = lazyPage(() => import("@/pages/admin/AdminVenueUpdateRequestsPage"), "AdminVenueUpdateRequestsPage");
const AdminSubscriptionsPage = lazyPage(() => import("@/pages/admin/AdminSubscriptionsPage"), "AdminSubscriptionsPage");
const AdminBookingRequestsPage = lazyPage(() => import("@/pages/admin/AdminBookingRequestsPage"), "AdminBookingRequestsPage");
const AdminVenueEnquiriesPage = lazyPage(() => import("@/pages/admin/AdminVenueEnquiriesPage"), "AdminVenueEnquiriesPage");
const AdminVenueClaimsPage = lazyPage(() => import("@/pages/admin/AdminVenueClaimsPage"), "AdminVenueClaimsPage");
const AdminVenueSuggestionsPage = lazyPage(() => import("@/pages/admin/AdminVenueSuggestionsPage"), "AdminVenueSuggestionsPage");
const AdminVenuesPage = lazyPage(() => import("@/pages/admin/AdminVenuesPage"), "AdminVenuesPage");
const VenueFormPage = lazyPage<{ mode: "edit" | "new" }>(() => import("@/pages/admin/VenueFormPage"), "VenueFormPage");
const AppErrorPreviewPage = lazyPage(() => import("@/pages/AppErrorPreviewPage"), "AppErrorPreviewPage");
const ClaimVenuePage = lazyPage(() => import("@/pages/ClaimVenuePage"), "ClaimVenuePage");
const CityPage = lazyPage(() => import("@/pages/CityPage"), "CityPage");
const CustomerBookingStatusPage = lazyPage(() => import("@/pages/CustomerBookingStatusPage"), "CustomerBookingStatusPage");
const DiscoverPage = lazyPage(() => import("@/pages/DiscoverPage"), "DiscoverPage");
const ForVenuesPage = lazyPage(() => import("@/pages/ForVenuesPage"), "ForVenuesPage");
const HomePage = lazyPage(() => import("@/pages/HomePage"), "HomePage");
const MonetisationDashboardPage = lazyPage(() => import("@/pages/admin/MonetisationDashboardPage"), "MonetisationDashboardPage");
const NotFoundPage = lazyPage(() => import("@/pages/NotFoundPage"), "NotFoundPage");
const OwnerDashboardPage = lazyPage(() => import("@/pages/owner/OwnerDashboardPage"), "OwnerDashboardPage");
const OwnerAnalyticsPage = lazyPage(() => import("@/pages/owner/OwnerAnalyticsPage"), "OwnerAnalyticsPage");
const OwnerBillingPage = lazyPage(() => import("@/pages/owner/OwnerBillingPage"), "OwnerBillingPage");
const OwnerBillingSuccessPage = lazyPage(() => import("@/pages/owner/OwnerBillingSuccessPage"), "OwnerBillingSuccessPage");
const OwnerBookingsPage = lazyPage(() => import("@/pages/owner/OwnerBookingsPage"), "OwnerBookingsPage");
const OwnerEnquiriesPage = lazyPage(() => import("@/pages/owner/OwnerEnquiriesPage"), "OwnerEnquiriesPage");
const OwnerVenueDashboardPage = lazyPage(() => import("@/pages/owner/OwnerVenueDashboardPage"), "OwnerVenueDashboardPage");
const OwnerVenueEnquiriesPage = lazyPage(() => import("@/pages/owner/OwnerVenueEnquiriesPage"), "OwnerVenueEnquiriesPage");
const OwnerVenueAvailabilityPage = lazyPage(() => import("@/pages/owner/OwnerVenueAvailabilityPage"), "OwnerVenueAvailabilityPage");
const OwnerVenueAnalyticsPage = lazyPage(() => import("@/pages/owner/OwnerVenueAnalyticsPage"), "OwnerVenueAnalyticsPage");
const OwnerVenueMediaPage = lazyPage(() => import("@/pages/owner/OwnerVenueMediaPage"), "OwnerVenueMediaPage");
const OwnerVenueUpdateRequestPage = lazyPage(() => import("@/pages/owner/OwnerVenueUpdateRequestPage"), "OwnerVenueUpdateRequestPage");
const OwnerPricingPage = lazyPage(() => import("@/pages/owner/OwnerPricingPage"), "OwnerPricingPage");
const OwnerPromotionsPage = lazyPage(() => import("@/pages/owner/OwnerPromotionsPage"), "OwnerPromotionsPage");
const OwnerRequestFeaturedPlacementPage = lazyPage(() => import("@/pages/owner/OwnerRequestFeaturedPlacementPage"), "OwnerRequestFeaturedPlacementPage");
const OwnerRequestPromotedOfferPage = lazyPage(() => import("@/pages/owner/OwnerRequestPromotedOfferPage"), "OwnerRequestPromotedOfferPage");
const PrivacyPage = lazyPage(() => import("@/pages/PrivacyPage"), "PrivacyPage");
const PromotedOfferPreviewPage = lazyPage(() => import("@/pages/PromotedOfferPreviewPage"), "PromotedOfferPreviewPage");
const RecommendPage = lazyPage(() => import("@/pages/RecommendPage"), "RecommendPage");
const RequestBookingPage = lazyPage(() => import("@/pages/RequestBookingPage"), "RequestBookingPage");
const SavedPage = lazyPage(() => import("@/pages/SavedPage"), "SavedPage");
const SignInPage = lazyPage(() => import("@/pages/SignInPage"), "SignInPage");
const SignUpPage = lazyPage(() => import("@/pages/SignUpPage"), "SignUpPage");
const SuggestVenuePage = lazyPage(() => import("@/pages/SuggestVenuePage"), "SuggestVenuePage");
const TermsPage = lazyPage(() => import("@/pages/TermsPage"), "TermsPage");
const VenueEnquiryPage = lazyPage(() => import("@/pages/VenueEnquiryPage"), "VenueEnquiryPage");
const VenuePage = lazyPage(() => import("@/pages/VenuePage"), "VenuePage");

function lazyPage<TProps = Record<string, never>>(loader: () => Promise<unknown>, exportName: string) {
  return lazy(async () => {
    const mod = (await loader()) as Record<string, ComponentType<TProps>>;
    return { default: mod[exportName] };
  });
}

function routeElement(element: ReactElement) {
  return <Suspense fallback={<PageLoadingState />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: routeElement(<AppLayout />),
    errorElement: <AppErrorPage />,
    children: [
      { path: "/", element: routeElement(<HomePage />) },
      { path: "/discover", element: routeElement(<DiscoverPage />) },
      { path: "/for-venues", element: routeElement(<ForVenuesPage />) },
      { path: "/cities/:citySlug", element: routeElement(<CityPage />) },
      { path: "/recommend", element: routeElement(<RecommendPage />) },
      { path: "/saved", element: routeElement(<SavedPage />) },
      { path: "/suggest", element: routeElement(<SuggestVenuePage />) },
      { path: "/privacy", element: routeElement(<PrivacyPage />) },
      { path: "/terms", element: routeElement(<TermsPage />) },
      {
        path: "/owner/bookings",
        element: routeElement(
          <RequireAuth>
            <OwnerBookingsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/account",
        element: routeElement(<AccountRoute />),
      },
      {
        path: "/account/bookings",
        element: routeElement(
          <RequireAuth>
            <MyBookingsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/account/notifications",
        element: routeElement(
          <RequireAuth>
            <NotificationsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/analytics",
        element: routeElement(
          <RequireAuth>
            <OwnerAnalyticsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/bookings",
        element: routeElement(
          <RequireAuth>
            <OwnerBookingsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner",
        element: routeElement(
          <RequireAuth>
            <OwnerDashboardPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues",
        element: routeElement(
          <RequireAuth>
            <OwnerDashboardPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/enquiries",
        element: routeElement(
          <RequireAuth>
            <OwnerEnquiriesPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/promotions",
        element: routeElement(
          <RequireAuth>
            <OwnerPromotionsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueDashboardPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/enquiries",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueEnquiriesPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/analytics",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueAnalyticsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/media",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueMediaPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/availability",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueAvailabilityPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/update",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueUpdateRequestPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/promotions/offers/new",
        element: routeElement(
          <RequireAuth>
            <OwnerRequestPromotedOfferPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/promotions/featured/new",
        element: routeElement(
          <RequireAuth>
            <OwnerRequestFeaturedPlacementPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/pricing",
        element: routeElement(
          <RequireAuth>
            <OwnerPricingPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/billing",
        element: routeElement(
          <RequireAuth>
            <OwnerBillingPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/billing/success",
        element: routeElement(
          <RequireAuth>
            <OwnerBillingSuccessPage />
          </RequireAuth>,
        ),
      },
      { path: "/sign-in", element: routeElement(<SignInPage />) },
      { path: "/sign-up", element: routeElement(<SignUpPage />) },
      { path: "/venues/:slug/claim", element: routeElement(<ClaimVenuePage />) },
      { path: "/venues/:slug/request-booking", element: routeElement(<RequestBookingPage />) },
      { path: "/booking-status/:token", element: routeElement(<CustomerBookingStatusPage />) },
      { path: "/venues/:slug/enquire", element: routeElement(<VenueEnquiryPage />) },
      { path: "/venues/:slug", element: routeElement(<VenuePage />) },
      ...(import.meta.env.DEV
        ? [
            { path: "/error-boundary-preview", element: routeElement(<AppErrorPreviewPage />) },
            { path: "/promoted-offer-preview", element: routeElement(<PromotedOfferPreviewPage />) },
          ]
        : []),
      {
        path: "/admin/bookings",
        element: routeElement(
          <RequireAdmin>
            <AdminBookingRequestsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/data-quality",
        element: routeElement(
          <RequireAdmin>
            <DataQualityPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/venue-updates",
        element: routeElement(
          <RequireAdmin>
            <AdminVenueUpdateRequestsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/media-review",
        element: routeElement(
          <RequireAdmin>
            <AdminMediaReviewPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/subscriptions",
        element: routeElement(
          <RequireAdmin>
            <AdminSubscriptionsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/promotion-requests",
        element: routeElement(
          <RequireAdmin>
            <AdminPromotionRequestsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/venues",
        element: routeElement(
          <RequireAdmin>
            <AdminVenuesPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/reviews",
        element: routeElement(
          <RequireAdmin>
            <AdminReviewsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/suggestions",
        element: routeElement(
          <RequireAdmin>
            <AdminVenueSuggestionsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/claims",
        element: routeElement(
          <RequireAdmin>
            <AdminVenueClaimsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/featured",
        element: routeElement(
          <RequireAdmin>
            <AdminFeaturedPlacementsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/enquiries",
        element: routeElement(
          <RequireAdmin>
            <AdminVenueEnquiriesPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/offers",
        element: routeElement(
          <RequireAdmin>
            <AdminPromotedOffersPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/analytics",
        element: routeElement(
          <RequireAdmin>
            <AdminVenueAnalyticsPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/monetisation",
        element: routeElement(
          <RequireAdmin>
            <MonetisationDashboardPage />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/venues/new",
        element: routeElement(
          <RequireAdmin>
            <VenueFormPage mode="new" />
          </RequireAdmin>,
        ),
      },
      {
        path: "/admin/venues/:id/edit",
        element: routeElement(
          <RequireAdmin>
            <VenueFormPage mode="edit" />
          </RequireAdmin>,
        ),
      },
      { path: "*", element: routeElement(<NotFoundPage />) },
    ],
  },
]);

function AccountRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.has("checkEmail")) return <AccountConfirmationPage />;
  return (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  );
}
