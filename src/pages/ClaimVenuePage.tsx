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
      setSuccessMessage("Your claim request has been submitted for review.");
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
        <PageMeta title="Venue not found | Sheesha" description="This venue is not available." />
        <PageContainer className="py-20">
          <ErrorState title="Venue not found" message="This venue is not available." />
        </PageContainer>
      </main>
    );
  }

  return (
    <main>
      <PageMeta title={`Claim ${venue.name} | Sheesha`} description={`Request to claim ${venue.name} on Sheesha.`} canonicalPath={`/venues/${venue.slug}/claim`} />
      <PageContainer className="py-10">
        <Link to={`/venues/${venue.slug}`} className="mb-5 inline-flex text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to {venue.name}
        </Link>

        <Card className="mx-auto max-w-3xl">
          <CardContent className="p-6">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">{venue.city}</p>
              <h1 className="mt-2 text-4xl font-semibold">{venue.name}</h1>
            </div>

            {venue.isClaimed ? (
              <ClaimState
                title="This venue has already been claimed."
                description="If you believe this is incorrect, contact support."
              />
            ) : !user ? (
              <ClaimState title="Sign in to claim this venue." description="Venue claims are reviewed before access is granted.">
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link to="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/sign-up">Create account</Link>
                  </Button>
                </div>
              </ClaimState>
            ) : isLoadingClaim ? (
              <LoadingState message="Checking claim status..." />
            ) : claim?.status === "pending" ? (
              <ClaimState title="Your claim request is pending review." description="We will review the information and update the venue status if approved.">
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
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}

function ClaimState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
