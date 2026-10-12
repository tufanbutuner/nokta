import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OwnerVenueTabHeader, useOwnerVenue } from "@/components/owner/OwnerVenueRouteLayout";
import { OwnerProfileStrengthCard } from "@/components/owner/updates/OwnerProfileStrengthCard";
import { OwnerRecentRequestsCard } from "@/components/owner/updates/OwnerRecentRequestsCard";
import { OwnerVenueProfileForm } from "@/components/owner/updates/OwnerVenueProfileForm";
import { PageMeta } from "@/components/seo/PageMeta";
import { UpgradePrompt } from "@/components/subscriptions/UpgradePrompt";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Toast, useToastTimeout, type ToastState } from "@/components/ui/toast";
import { brandConfig } from "@/config/brand";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { subscriptionHasPlanAccess } from "@/lib/planFeatureAccess";
import { createOwnerVenueUpdateRequest, getMyVenueUpdateRequestsForVenue, cancelOwnerVenueUpdateRequest } from "@/services/ownerVenueUpdateRequestService";
import type { VenueUpdateRequest, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";

export function OwnerVenueUpdateRequestPage() {
  const { user } = useAuth();
  const { venue, subscription } = useOwnerVenue();
  const [requests, setRequests] = useState<VenueUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyVenueUpdateRequestsForVenue({ userId: user.id, venueId: venue.id })
      .then((nextRequests) => {
        if (cancelled) return;
        setRequests(nextRequests);
        trackEvent("owner_profile_update_started", { venueId: venue.id, city: venue.city, area: venue.area, partnerTier: venue.partnerTier });
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
    // Track and load once per venue, not on every venue object refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, venue.id]);

  /**
   * Returns whether the request was created, so the form only clears its
   * review panel on success.
   */
  async function handleSubmit(input: VenueUpdateRequestInput) {
    if (!user) return false;
    setIsSubmitting(true);
    try {
      const request = await createOwnerVenueUpdateRequest({ userId: user.id, request: input });
      setRequests((current) => [request, ...current]);
      setToast({ type: "success", title: "Sent for review", message: "Your changes are with the nokta team, usually reviewed within one working day." });
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not submit update request.";
      setToast({ type: "error", title: "Not submitted", message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(request: VenueUpdateRequest) {
    if (!user) return;
    setCancellingId(request.id);
    try {
      const updated = await cancelOwnerVenueUpdateRequest({ userId: user.id, requestId: request.id });
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setToast({ type: "error", title: "Not cancelled", message: caughtError instanceof Error ? caughtError.message : "Could not cancel update request." });
    } finally {
      setCancellingId(null);
    }
  }

  const handleDirtyChange = useCallback(setIsDirty, []);
  const dismissToast = useCallback(() => setToast(null), []);
  useToastTimeout(toast, dismissToast);

  function focusField(field: "description" | "phone") {
    const node = formRef.current?.querySelector<HTMLElement>(field === "description" ? "textarea" : "input");
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    node?.focus({ preventScroll: true });
  }

  const canEdit = subscriptionHasPlanAccess(subscription, "profile_update_requests");
  const pendingRequest = requests.find((request) => request.status === "pending") ?? null;

  return (
    <>
      <PageMeta title={`${venue.name} profile | nokta`} description="Review venue profile details and submit approved-field changes." canonicalPath={`/owner/venues/${venue.slug}/profile`} />
      <OwnerVenueTabHeader
        title={venue.name}
        canNavigate={() => !isDirty || window.confirm("You have unsaved changes. Leave without submitting?")}
        actions={<Button asChild variant="outline" className="h-9 rounded-lg border-nokta-border-input text-sm font-medium"><Link to={`/venues/${venue.slug}`}>Preview public page</Link></Button>}
      />
      {isLoading ? <LoadingState message="Loading update request..." /> : error ? <ErrorState message={error} /> : (
          <div className="flex flex-wrap items-start gap-x-7 gap-y-5 pb-[170px]">
            <main ref={formRef} className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <div className="rounded-2xl bg-nokta-hover px-5 py-4 text-sm leading-relaxed text-nokta-ink-subtle">
                <strong className="font-semibold text-nokta-ink">Changes here are reviewed by nokta before they go live.</strong>{" "}
                Menu, prices and photos publish instantly from their own tabs. Venue name, address and location need verification — <a href={`mailto:${brandConfig.supportEmail}`} className="font-medium text-nokta-accent-dark hover:underline">contact us</a> to change them.
              </div>

              {canEdit ? (
                <OwnerVenueProfileForm venue={venue} pendingRequest={pendingRequest} onSubmit={handleSubmit} isSubmitting={isSubmitting} onDirtyChange={handleDirtyChange} />
              ) : (
                <UpgradePrompt feature="profile_update_requests" currentPlan={subscription?.plan ?? "free"} venueId={venue.id} />
              )}
            </main>

            <aside className="sticky top-5 flex max-w-full flex-[1_1_260px] flex-col gap-4">
              <OwnerProfileStrengthCard venue={venue} subscription={subscription} onFocusField={canEdit ? focusField : undefined} />
              <OwnerRecentRequestsCard requests={requests} onCancel={handleCancel} cancellingId={cancellingId} />
            </aside>
          </div>
      )}
      {toast ? <Toast {...toast} onClose={dismissToast} offsetBottom={isDirty} /> : null}
    </>
  );
}
