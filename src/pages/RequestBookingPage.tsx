import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookingRequestForm } from "@/components/bookings/BookingRequestForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { createBookingRequest } from "@/services/bookingRequestService";
import type { CreateBookingRequestInput } from "@/types/bookingRequests";

export function RequestBookingPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { venues, isLoading, error } = useVenues();
  const venue = venues.find((item) => item.slug === slug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!venue) return;
    trackEvent("booking_request_page_viewed", { venueId: venue.id, city: venue.city, area: venue.area, sourceSurface: "venue_page" });
  }, [venue]);

  async function handleSubmit(request: CreateBookingRequestInput) {
    if (!venue) return;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await createBookingRequest({ userId: user?.id ?? null, request, venue });
      setSuccess(true);
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "We could not send your booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <main><PageContainer className="py-20"><LoadingState message="Loading venue..." /></PageContainer></main>;
  if (error) return <main><PageContainer className="py-20"><ErrorState message={error} /></PageContainer></main>;
  if (!venue) return <main><PageMeta title="Venue not found | Sheesha" description="This venue is not available." /><PageContainer className="py-20"><ErrorState title="Venue not found" message="This venue is not available." /></PageContainer></main>;

  return (
    <main>
      <PageMeta title={`Request booking at ${venue.name} | Sheesha`} description={`Request a booking at ${venue.name}.`} canonicalPath={`/venues/${venue.slug}/request-booking`} />
      <PageContainer className="py-10">
        <Link to={`/venues/${venue.slug}`} className="mb-5 inline-flex text-sm font-medium text-muted-foreground hover:text-foreground">Back to {venue.name}</Link>
        <Card className="mx-auto max-w-3xl">
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm text-muted-foreground">{venue.city} • {venue.area}</p>
              <h1 className="mt-2 font-brand text-4xl font-bold tracking-[-0.5px]">Request booking at {venue.name}</h1>
            </div>
            {success ? (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <strong>Your booking request has been sent.</strong>
                  <span className="mt-1 block">This is not a confirmed booking yet. The venue will review your request and follow up.</span>
                </Alert>
                <Button asChild><Link to={`/venues/${venue.slug}`}>Back to venue</Link></Button>
              </div>
            ) : (
              <BookingRequestForm venueId={venue.id} defaultEmail={user?.email} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
            )}
            {mutationError ? <Alert className="border-destructive/30 text-destructive">{mutationError}</Alert> : null}
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
