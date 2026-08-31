import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminSubscriptionEditDialog } from "@/components/admin/subscriptions/AdminSubscriptionEditDialog";
import { AdminSubscriptionFilters, type AdminSubscriptionFilterState } from "@/components/admin/subscriptions/AdminSubscriptionFilters";
import { AdminSubscriptionSummaryCards } from "@/components/admin/subscriptions/AdminSubscriptionSummaryCards";
import { AdminSubscriptionTable } from "@/components/admin/subscriptions/AdminSubscriptionTable";
import { AdminStartTrialDialog } from "@/components/admin/subscriptions/AdminStartTrialDialog";
import { PageMeta } from "@/components/seo/PageMeta";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { createFreeSubscriptionFallback } from "@/lib/subscriptionMappers";
import { cancelVenueSubscription, getAdminVenueSubscriptions, startVenueSubscriptionTrial, updateVenueSubscriptionPlan, upsertVenueSubscription } from "@/services/adminSubscriptionService";
import { useVenues } from "@/hooks/useVenues";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

type SubscriptionRow = { venue: Venue; subscription: VenueSubscription };

export function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const [subscriptions, setSubscriptions] = useState<VenueSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [filters, setFilters] = useState<AdminSubscriptionFilterState>({ query: "", plan: "all", status: "all", city: "all" });
  const [editingRow, setEditingRow] = useState<SubscriptionRow | null>(null);
  const [trialRow, setTrialRow] = useState<SubscriptionRow | null>(null);
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingSubscriptions(true);
    getAdminVenueSubscriptions()
      .then((nextSubscriptions) => {
        if (!cancelled) setSubscriptions(nextSubscriptions);
      })
      .catch((caughtError) => {
        if (!cancelled) setActionError(caughtError instanceof Error ? caughtError.message : "Could not load subscriptions.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSubscriptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const byVenueId = new Map(subscriptions.map((subscription) => [subscription.venueId, subscription]));
    return venues
      .filter((venue) => venue.isClaimed)
      .map((venue) => ({ venue, subscription: byVenueId.get(venue.id) ?? createFreeSubscriptionFallback({ venueId: venue.id }) }));
  }, [subscriptions, venues]);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return rows.filter(({ venue, subscription }) => {
      if (query && !venue.name.toLowerCase().includes(query)) return false;
      if (filters.plan !== "all" && subscription.plan !== filters.plan) return false;
      if (filters.status !== "all" && subscription.status !== filters.status) return false;
      if (filters.city !== "all" && venue.city !== filters.city) return false;
      return true;
    });
  }, [filters, rows]);

  async function refreshSubscription(nextSubscription: VenueSubscription) {
    setSubscriptions((current) => {
      const exists = current.some((subscription) => subscription.venueId === nextSubscription.venueId);
      return exists ? current.map((subscription) => (subscription.venueId === nextSubscription.venueId ? nextSubscription : subscription)) : [nextSubscription, ...current];
    });
  }

  async function handleSaveEdit(input: Parameters<typeof updateVenueSubscriptionPlan>[0] & { currentPeriodStart?: string | null; currentPeriodEnd?: string | null }) {
    if (!editingRow || !user) return;
    setUpdatingVenueId(editingRow.venue.id);
    setActionError(null);
    try {
      const nextSubscription = await upsertVenueSubscription({
        subscription: {
          venueId: editingRow.venue.id,
          plan: input.plan,
          status: input.status,
          billingProvider: "manual",
          currentPeriodStart: input.currentPeriodStart ?? null,
          currentPeriodEnd: input.currentPeriodEnd ?? null,
          adminNotes: input.adminNotes,
        },
        adminUserId: user.id,
      });
      await refreshSubscription(nextSubscription);
      setEditingRow(null);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update subscription.");
    } finally {
      setUpdatingVenueId(null);
    }
  }

  async function handleStartTrial(input: { plan: "starter" | "growth" | "pro"; trialDays: number; adminNotes: string | null }) {
    if (!trialRow || !user) return;
    setUpdatingVenueId(trialRow.venue.id);
    setActionError(null);
    try {
      const nextSubscription = await startVenueSubscriptionTrial({ venueId: trialRow.venue.id, adminUserId: user.id, ...input });
      await refreshSubscription(nextSubscription);
      setTrialRow(null);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not start trial.");
    } finally {
      setUpdatingVenueId(null);
    }
  }

  async function handleCancel(row: SubscriptionRow) {
    if (!user) return;
    setUpdatingVenueId(row.venue.id);
    setActionError(null);
    try {
      await refreshSubscription(await cancelVenueSubscription({ venueId: row.venue.id, adminUserId: user.id }));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not cancel subscription.");
    } finally {
      setUpdatingVenueId(null);
    }
  }

  const isLoading = venuesLoading || isLoadingSubscriptions;

  return (
    <AdminPageShell activePath="/admin/subscriptions">
      <PageMeta title="Subscriptions | nokta Admin" description="Manually manage venue plans and subscription access." />
      {isLoading ? <div className="py-20"><LoadingState message="Loading subscriptions..." /></div> : venuesError ? <div className="py-20"><ErrorState message={venuesError} /></div> : (
        <div className="grid gap-5 py-5">
          <div>
            <p className="text-sm text-clay-accent">Billing foundation</p>
            <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Subscriptions</h1>
            <p className="mt-2 text-sm text-[#8a7e72]">Manual plan access for claimed venues. Stripe checkout is not enabled yet.</p>
          </div>
          {actionError ? <Alert className="border-clay-400/20 bg-clay-400/10 text-clay-600">{actionError}</Alert> : null}
          <AdminSubscriptionSummaryCards subscriptions={rows.map((row) => row.subscription)} />
          <AdminSubscriptionFilters value={filters} onChange={setFilters} />
          {filteredRows.length ? (
            <AdminSubscriptionTable rows={filteredRows} updatingVenueId={updatingVenueId} onEdit={setEditingRow} onTrial={setTrialRow} onCancel={handleCancel} />
          ) : (
            <div className="rounded-xl border border-black/[0.04] bg-white">
              <EmptyState title="No subscriptions match these filters" description="Adjust the filters to continue reviewing venue plans." />
            </div>
          )}
        </div>
      )}
      {editingRow ? (
        <AdminSubscriptionEditDialog
          subscription={editingRow.subscription}
          isSaving={updatingVenueId === editingRow.venue.id}
          onClose={() => setEditingRow(null)}
          onSave={(input) => handleSaveEdit({ venueId: editingRow.venue.id, adminUserId: user?.id ?? "", ...input })}
        />
      ) : null}
      {trialRow ? (
        <AdminStartTrialDialog venueName={trialRow.venue.name} isSaving={updatingVenueId === trialRow.venue.id} onClose={() => setTrialRow(null)} onStart={handleStartTrial} />
      ) : null}
    </AdminPageShell>
  );
}
