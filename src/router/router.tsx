import { Suspense, lazy, type ComponentType, type ReactElement } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoadingState } from "@/components/state/PageLoadingState";
import { AppErrorPage } from "@/pages/AppErrorPage";
import { Navigate, createBrowserRouter, useLocation, useParams, useSearchParams } from "react-router-dom";

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
const OwnerEnquiriesPage = lazyPage(() => import("@/pages/owner/OwnerEnquiriesPage"), "OwnerEnquiriesPage");
const OwnerVenueBookingsPage = lazyPage(() => import("@/pages/owner/OwnerVenueBookingsPage"), "OwnerVenueBookingsPage");
const OwnerVenueBookingRulesPage = lazyPage(() => import("@/pages/owner/OwnerVenueBookingRulesPage"), "OwnerVenueBookingRulesPage");
const OwnerVenueAnalyticsPage = lazyPage(() => import("@/pages/owner/OwnerVenueAnalyticsPage"), "OwnerVenueAnalyticsPage");
const OwnerVenueMediaPage = lazyPage(() => import("@/pages/owner/OwnerVenueMediaPage"), "OwnerVenueMediaPage");
const OwnerVenueMenuPage = lazyPage(() => import("@/pages/owner/OwnerVenueMenuPage"), "OwnerVenueMenuPage");
const OwnerVenueUpdateRequestPage = lazyPage(() => import("@/pages/owner/OwnerVenueUpdateRequestPage"), "OwnerVenueUpdateRequestPage");
const OwnerVenuesPage = lazyPage(() => import("@/pages/owner/OwnerVenuesPage"), "OwnerVenuesPage");
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
        element: routeElement(<OwnerInboxRedirect bookingOnly />),
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
            <OwnerVenueBookingsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/bookings/rules",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueBookingRulesPage />
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
            <OwnerVenuesPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/inbox",
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
            <VenueRouteRedirect destination="profile" />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/profile",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueUpdateRequestPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/performance",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueAnalyticsPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/menu",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueMenuPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/photos",
        element: routeElement(
          <RequireAuth>
            <OwnerVenueMediaPage />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/analytics",
        element: routeElement(
          <RequireAuth>
            <VenueRouteRedirect destination="performance" />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/media",
        element: routeElement(
          <RequireAuth>
            <VenueRouteRedirect destination="photos" />
          </RequireAuth>,
        ),
      },
      {
        path: "/owner/venues/:venueId/availability",
        element: routeElement(<RequireAuth><VenueRouteRedirect destination="bookings" /></RequireAuth>),
      },
      {
        path: "/owner/venues/:venueId/update",
        element: routeElement(<RequireAuth><VenueRouteRedirect destination="profile" /></RequireAuth>),
      },
      {
        path: "/owner/venues/:venueId/enquiries",
        element: routeElement(<RequireAuth><VenueInboxRedirect /></RequireAuth>),
      },
      { path: "/owner/enquiries", element: routeElement(<OwnerInboxRedirect />) },
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
        element: <Navigate to="/owner/billing" replace />,
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

function VenueRouteRedirect({ destination }: { destination: "profile" | "photos" | "bookings" | "performance" }) {
  const { venueId = "" } = useParams();
  const { search } = useLocation();
  return <Navigate replace to={`/owner/venues/${venueId}/${destination}${search}`} />;
}

function VenueInboxRedirect() {
  const { venueId = "" } = useParams();
  const { search } = useLocation();
  const nextSearch = new URLSearchParams(search);
  nextSearch.set("venue", venueId);
  return <Navigate replace to={`/owner/inbox?${nextSearch.toString()}`} />;
}

function OwnerInboxRedirect({ bookingOnly = false }: { bookingOnly?: boolean }) {
  const { search } = useLocation();
  const nextSearch = new URLSearchParams(search);
  const legacyBookingId = nextSearch.get("booking");
  if (legacyBookingId) {
    nextSearch.set("item", legacyBookingId);
    nextSearch.delete("booking");
  }
  if (bookingOnly) nextSearch.set("type", "booking");
  const query = nextSearch.toString();
  return <Navigate replace to={`/owner/inbox${query ? `?${query}` : ""}`} />;
}
