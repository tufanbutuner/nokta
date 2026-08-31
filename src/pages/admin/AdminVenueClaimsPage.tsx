import { useEffect, useMemo, useState } from "react";
import { AdminClaimFilters, type AdminClaimStatusFilter } from "@/components/admin/claims/AdminClaimFilters";
import { AdminClaimNotesDialog } from "@/components/admin/claims/AdminClaimNotesDialog";
import { AdminClaimSummaryCards } from "@/components/admin/claims/AdminClaimSummaryCards";
import { AdminClaimTable } from "@/components/admin/claims/AdminClaimTable";
import type { ClaimAction } from "@/components/admin/claims/AdminClaimActions";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import {
  approveVenueClaimRequest,
  getAdminVenueClaimRequests,
  rejectVenueClaimRequest,
  updateVenueClaimRequestStatus,
} from "@/services/adminVenueClaimService";
import type { Venue } from "@/types/venue";
import type { VenueClaimRequest } from "@/types/venueClaims";

export function AdminVenueClaimsPage() {
  const { user } = useAuth();
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [claims, setClaims] = useState<VenueClaimRequest[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminClaimStatusFilter>("all");
  const [pendingClaimId, setPendingClaimId] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<ClaimAction | null>(null);
  const [dialogClaim, setDialogClaim] = useState<VenueClaimRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingClaims(true);
    setError(null);

    getAdminVenueClaimRequests()
      .then((nextClaims) => {
        if (!cancelled) {
          setClaims(nextClaims);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Could not load venue claim requests.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingClaims(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const venuesById = useMemo<Record<string, Venue | undefined>>(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
    [venues],
  );

  const filteredClaims = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return claims.filter((claim) => {
      if (status !== "all" && claim.status !== status) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const venue = venuesById[claim.venueId];
      const haystack = [
        venue?.name,
        venue?.city,
        venue?.area,
        claim.venueId,
        claim.claimantName,
        claim.claimantEmail,
        claim.claimantPhone,
        claim.claimantRole,
        claim.businessEmail,
        claim.businessPhone,
        claim.proofUrl,
        claim.proofNotes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [claims, query, status, venuesById]);

  function openDialog(action: ClaimAction, claim: VenueClaimRequest) {
    setMutationError(null);
    setDialogAction(action);
    setDialogClaim(claim);
  }

  function closeDialog() {
    if (pendingClaimId) {
      return;
    }

    setDialogAction(null);
    setDialogClaim(null);
  }

  async function handleDialogSubmit(adminNotes: string) {
    if (!dialogClaim || !dialogAction || !user) {
      return;
    }

    setPendingClaimId(dialogClaim.id);
    setMutationError(null);

    try {
      const nextClaim =
        dialogAction === "approve"
          ? await approveVenueClaimRequest({
              claimRequestId: dialogClaim.id,
              venueId: dialogClaim.venueId,
              submittedBy: dialogClaim.submittedBy,
              adminUserId: user.id,
              adminNotes,
            })
          : dialogAction === "reject"
            ? await rejectVenueClaimRequest({
                claimRequestId: dialogClaim.id,
                adminUserId: user.id,
                adminNotes,
              })
            : await updateVenueClaimRequestStatus({
                claimRequestId: dialogClaim.id,
                status: dialogClaim.status,
                adminUserId: user.id,
                adminNotes,
              });

      setClaims((currentClaims) => currentClaims.map((claim) => (claim.id === nextClaim.id ? nextClaim : claim)));
      setDialogAction(null);
      setDialogClaim(null);
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not update claim request.");
    } finally {
      setPendingClaimId(null);
    }
  }

  const isLoading = isLoadingClaims || isLoadingVenues;

  return (
    <AdminPageShell activePath="/admin/claims">
      <PageMeta title="Venue Claims | nokta Admin" description="Review and manage venue ownership claim requests." />
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Venue claims</h1>
          </div>
          <p className="text-sm text-[#8a7e72]">{filteredClaims.length} claim requests</p>
        </div>

        <AdminClaimSummaryCards claims={claims} />
        <AdminClaimFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />

        {mutationError ? <Alert className="border-destructive/30 text-destructive">{mutationError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}

        {isLoading ? (
          <LoadingState message="Loading venue claim requests..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : filteredClaims.length ? (
          <AdminClaimTable claims={filteredClaims} venuesById={venuesById} pendingClaimId={pendingClaimId} onAction={openDialog} />
        ) : (
          <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No claims match these filters.</div>
        )}
      </div>

      <AdminClaimNotesDialog
        open={Boolean(dialogAction && dialogClaim)}
        action={dialogAction}
        claim={dialogClaim}
        isSubmitting={Boolean(pendingClaimId)}
        onCancel={closeDialog}
        onSubmit={handleDialogSubmit}
      />
    </AdminPageShell>
  );
}
