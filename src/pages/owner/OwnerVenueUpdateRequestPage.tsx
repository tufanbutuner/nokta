import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueUpdateForm } from "@/components/owner/updates/OwnerVenueUpdateForm";
import { OwnerVenueUpdateRequestsList } from "@/components/owner/updates/OwnerVenueUpdateRequestsList";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { createOwnerVenueUpdateRequest, getMyVenueUpdateRequestsForVenue, cancelOwnerVenueUpdateRequest } from "@/services/ownerVenueUpdateRequestService";
import type { Venue } from "@/types/venue";
import type { VenueUpdateRequest, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";

const UPDATE_ENABLED_TIERS = new Set(["starter", "growth", "pro"]);

export function OwnerVenueUpdateRequestPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [requests, setRequests] = useState<VenueUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    getMyClaimedVenue({ userId: user.id, venueId })
      .then(async (nextVenue) => {
        if (!nextVenue) throw new Error("Venue dashboard not found.");
        const nextRequests = await getMyVenueUpdateRequestsForVenue({ userId: user.id, venueId: nextVenue.id });
        return { nextVenue, nextRequests };
      })
      .then(({ nextVenue, nextRequests }) => {
        if (cancelled) return;
        setVenue(nextVenue);
        setRequests(nextRequests);
        trackEvent("owner_profile_update_started", { venueId: nextVenue.id, city: nextVenue.city, area: nextVenue.area, partnerTier: nextVenue.partnerTier });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load update request page.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  async function handleSubmit(input: VenueUpdateRequestInput) {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const request = await createOwnerVenueUpdateRequest({ userId: user.id, request: input });
      setRequests((current) => [request, ...current]);
      setSuccess(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not submit update request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(request: VenueUpdateRequest) {
    if (!user) return;
    const updated = await cancelOwnerVenueUpdateRequest({ userId: user.id, requestId: request.id });
    setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `Request profile update | ${venue.name}` : "Request profile update | Sheesha"} description="Submit a reviewed profile update request." />
      {isLoading ? <LoadingState message="Loading update request..." /> : error && !venue ? <ErrorState message={error} /> : venue ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-clay-accent">Profile management</p>
              <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Request profile update</h1>
              <p className="mt-2 text-sm text-muted-foreground">{venue.name} · {venue.city} · {venue.area}</p>
            </div>
            <Button asChild variant="outline"><Link to={`/owner/venues/${venue.slug}`}>Back to dashboard</Link></Button>
          </div>
          {!UPDATE_ENABLED_TIERS.has(venue.partnerTier) ? (
            <Alert>
              <strong>Profile management is part of the Starter plan.</strong>
              <span className="mt-1 block">Contact Sheesha about upgrading to request structured profile updates from your dashboard.</span>
            </Alert>
          ) : success ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">Your update request has been submitted for admin review.</Alert>
          ) : (
            <OwnerVenueUpdateForm venue={venue} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
          {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Latest update requests</h2>
            <OwnerVenueUpdateRequestsList requests={requests} onCancel={handleCancel} />
          </section>
        </div>
      ) : null}
    </OwnerLayout>
  );
}
