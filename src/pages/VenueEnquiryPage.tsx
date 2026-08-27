import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { VenueEnquiryForm } from "@/components/enquiries/VenueEnquiryForm";
import { MyVenueEnquiries } from "@/components/enquiries/MyVenueEnquiries";
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
import { createVenueEnquiry, getMyVenueEnquiriesForVenue } from "@/services/venueEnquiryService";
import type { VenueEnquiry, VenueEnquiryInput } from "@/types/venueEnquiries";

export function VenueEnquiryPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { venues, isLoading, error } = useVenues();
  const venue = venues.find((item) => item.slug === slug);
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user || !venue) return;
    let cancelled = false;
    getMyVenueEnquiriesForVenue({ userId: user.id, venueId: venue.id }).then((next) => {
      if (!cancelled) setEnquiries(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, venue]);

  async function handleSubmit(input: VenueEnquiryInput) {
    if (!user || !venue) return;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      const enquiry = await createVenueEnquiry({ userId: user.id, enquiry: input });
      setEnquiries((current) => [enquiry, ...current]);
      setSuccess(true);
      trackEvent("venue_enquiry_submitted", {
        venueId: venue.id,
        venueSlug: venue.slug,
        venueName: venue.name,
        city: venue.city,
        area: venue.area,
        enquiryType: input.enquiryType,
        partySize: input.partySize ?? null,
        hasPreferredDate: Boolean(input.preferredDate),
        hasPreferredTime: Boolean(input.preferredTime),
        hasPhone: Boolean(input.customerPhone),
        hasMessage: Boolean(input.message),
      });
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not send enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <main><PageContainer className="py-20"><LoadingState message="Loading venue..." /></PageContainer></main>;
  if (error) return <main><PageContainer className="py-20"><ErrorState message={error} /></PageContainer></main>;
  if (!venue) return <main><PageMeta title="Venue not found | Sheesha" description="This venue is not available." /><PageContainer className="py-20"><ErrorState title="Venue not found" message="This venue is not available." /></PageContainer></main>;

  return (
    <main>
      <PageMeta title={`Send enquiry to ${venue.name} | Sheesha`} description={`Send an enquiry to ${venue.name}.`} canonicalPath={`/venues/${venue.slug}/enquire`} />
      <PageContainer className="py-10">
        <Link to={`/venues/${venue.slug}`} className="mb-5 inline-flex text-sm font-medium text-muted-foreground hover:text-foreground">Back to {venue.name}</Link>
        <Card className="mx-auto max-w-3xl">
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm text-muted-foreground">{venue.city} · {venue.area}</p>
              <h1 className="mt-2 text-4xl font-semibold">Enquire about {venue.name}</h1>
            </div>
            {!user ? (
              <div>
                <h2 className="text-2xl font-semibold">Sign in to send an enquiry.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">This helps venues understand who is contacting them and reduces spam.</p>
                <div className="mt-6 flex gap-3"><Button asChild><Link to="/sign-in">Sign in</Link></Button><Button asChild variant="outline"><Link to="/sign-up">Create account</Link></Button></div>
              </div>
            ) : success ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">Your enquiry has been sent. This is not a confirmed booking. The venue or Sheesha team may follow up if more information is needed.</Alert>
            ) : (
              <VenueEnquiryForm venueId={venue.id} defaultEmail={user.email} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
            )}
            {mutationError ? <Alert className="border-destructive/30 text-destructive">{mutationError}</Alert> : null}
            {user ? <div><h2 className="mb-3 text-xl font-semibold">Recent enquiries for this venue</h2><MyVenueEnquiries enquiries={enquiries} venuesById={{ [venue.id]: venue }} /></div> : null}
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
