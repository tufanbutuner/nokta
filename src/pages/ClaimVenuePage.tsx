import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ClaimVenueForm } from "@/components/claims/ClaimVenueForm";
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
import { cancelMyVenueClaimRequest, createVenueClaimRequest, getMyClaimRequestForVenue } from "@/services/venueClaimService";
import type { VenueClaimRequest, VenueClaimRequestInput } from "@/types/venueClaims";

export function ClaimVenuePage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { venues, isLoading, error } = useVenues();
  const venue = venues.find((item) => item.slug === slug);
  const [claim, setClaim] = useState<VenueClaimRequest | null>(null);
  const [isLoadingClaim, setIsLoadingClaim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!venue) {
      return;
    }
    trackEvent("venue_claim_started", { venueId: venue.id });
  }, [venue]);

  useEffect(() => {
    if (!user || !venue) {
      setClaim(null);
      return;
    }

    let cancelled = false;
    setIsLoadingClaim(true);
    setMutationError(null);

    getMyClaimRequestForVenue({ userId: user.id, venueId: venue.id })
      .then((nextClaim) => {
        if (!cancelled) {
          setClaim(nextClaim);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setMutationError(caughtError instanceof Error ? caughtError.message : "Could not load claim request.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingClaim(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, venue]);

  async function handleSubmit(input: VenueClaimRequestInput) {
    if (!user || !venue) {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);
    setSuccessMessage(null);

    try {
      const nextClaim = await createVenueClaimRequest({ userId: user.id, claim: input });
      setClaim(nextClaim);
      setSuccessMessage("Your claim request has been sent. The Nokta team will review your request. If approved, you will be able to manage this venue from your owner dashboard.");
      trackEvent("venue_claim_submitted", { venueId: venue.id });
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not submit claim request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!claim) {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      const nextClaim = await cancelMyVenueClaimRequest({ claimRequestId: claim.id });
      setClaim(nextClaim);
      trackEvent("venue_claim_cancelled", { venueId: claim.venueId });
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not cancel claim request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <PageContainer className="py-20">
          <LoadingState message="Loading venue..." />
        </PageContainer>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <PageContainer className="py-20">
          <ErrorState message={error} />
        </PageContainer>
      </main>
    );
  }

  if (!venue) {
    return (
      <main>
        <PageMeta title="Venue not found | nokta" description="This venue is not available." />
        <PageContainer className="py-20">
          <ErrorState title="Venue not found" message="This venue is not available." />
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="bg-nokta-page-bg">
      <PageMeta title={`Claim ${venue.name} | Nokta`} description={`Request to claim ${venue.name} on Nokta.`} canonicalPath={`/venues/${venue.slug}/claim`} />
      <PageContainer className="py-8 sm:py-12">
        <Link to={`/venues/${venue.slug}`} className="mb-5 inline-flex text-sm font-medium text-nokta-ink-muted hover:text-nokta-ink">
          Back to {venue.name}
        </Link>

        <Card className="mx-auto max-w-4xl rounded-2xl border-nokta-border bg-white shadow-sm shadow-stone-950/5">
          <CardContent className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-nokta-accent-dark">Claim venue profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-nokta-ink sm:text-4xl">{venue.name}</h1>
              <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">
                Claiming a venue lets you manage key parts of the profile, receive booking requests, upload original venue photos and access owner tools.
              </p>
            </div>

            {venue.isClaimed ? (
              <ClaimState
                title="This venue has already been claimed."
                description="If you believe this is incorrect, contact Nokta support and we will review the profile."
              />
            ) : !user ? (
              <ClaimState title="Sign in to claim this venue." description="Venue claims are reviewed before owner access is granted. This protects venue profiles and keeps customer-facing details trustworthy.">
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-xl bg-nokta-ink text-white hover:bg-nokta-ink/90">
                    <Link to="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-nokta-border bg-white">
                    <Link to="/sign-up">Create account</Link>
                  </Button>
                </div>
              </ClaimState>
            ) : isLoadingClaim ? (
              <LoadingState message="Checking claim status..." />
            ) : claim?.status === "pending" ? (
              <ClaimState title="Your claim request is pending review." description="The Nokta team will review your request. If approved, this venue will appear in your owner dashboard with setup steps to complete.">
                {mutationError ? <Alert className="mt-5 border-destructive/30 text-destructive">{mutationError}</Alert> : null}
                <Button className="mt-6" variant="outline" disabled={isSubmitting} onClick={handleCancel}>
                  {isSubmitting ? "Cancelling..." : "Cancel request"}
                </Button>
              </ClaimState>
            ) : (
              <>
                {successMessage ? <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-900">{successMessage}</Alert> : null}
                <ClaimVenueForm
                  venueId={venue.id}
                  defaultEmail={user.email}
                  isSubmitting={isSubmitting}
                  error={mutationError}
                  onSubmit={handleSubmit}
                />
              </>
            )}
            </div>
            <aside className="rounded-2xl border border-nokta-border bg-nokta-page-bg/50 p-5">
              <h2 className="font-semibold text-nokta-ink">After approval</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-nokta-ink-muted">
                <li>Manage profile details through owner update requests.</li>
                <li>Upload original venue photos for review.</li>
                <li>Configure availability and receive booking requests.</li>
                <li>Track enquiries, bookings and promotion opportunities.</li>
              </ul>
              <Button asChild variant="outline" className="mt-5 w-full rounded-xl border-nokta-border bg-white">
                <Link to="/for-venues">Learn about owner tools</Link>
              </Button>
            </aside>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}

function ClaimState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-nokta-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">{description}</p>
      {children}
    </div>
  );
}
