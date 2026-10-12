import { useEffect, useMemo, useState } from "react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MyBookingsEmptyState } from "@/components/account/bookings/MyBookingsEmptyState";
import { MyBookingsFilters, type MyBookingsFilterValue } from "@/components/account/bookings/MyBookingsFilters";
import { MyBookingsList } from "@/components/account/bookings/MyBookingsList";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { getMyCustomerBookings } from "@/services/customerBookingsService";
import type { BookingRequest } from "@/types/bookingRequests";
import type { Venue } from "@/types/venue";

export function MyBookingsPage() {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filter, setFilter] = useState<MyBookingsFilterValue>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMyCustomerBookings({ userId: user.id })
      .then((nextBookings) => {
        if (cancelled) return;
        setBookings(nextBookings);
        trackEvent("customer_bookings_page_viewed", {
          bookingCount: nextBookings.length,
          hasActionNeeded: nextBookings.some((booking) => booking.status === "alternative_proposed"),
        });
        if (!nextBookings.length) trackEvent("customer_bookings_empty_state_viewed", { bookingCount: 0, hasActionNeeded: false });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load your bookings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const venuesById = useMemo<Record<string, Venue | undefined>>(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
    [venues],
  );

  return (
    <main>
      <PageMeta title="My bookings | nokta" description="Track your booking requests and confirmed bookings." canonicalPath="/account/bookings" />
      <PageContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <AccountPageHeader title="Bookings" description="Requests you've sent, and how each venue replied." />

          {isLoading ? <LoadingState message="Loading your bookings..." /> : null}
          {error ? <ErrorState title="Could not load bookings" message={error} /> : null}
          {!isLoading && !error && !bookings.length ? <MyBookingsEmptyState /> : null}
          {!isLoading && !error && bookings.length ? (
            <>
              <MyBookingsFilters value={filter} onChange={setFilter} />
              <MyBookingsList bookings={bookings} venuesById={venuesById} filter={filter} />
            </>
          ) : null}
        </div>
      </PageContainer>
    </main>
  );
}
