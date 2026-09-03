import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFeaturedPlacementForm } from "@/components/admin/featured/AdminFeaturedPlacementForm";
import { AdminFeaturedPlacementTable } from "@/components/admin/featured/AdminFeaturedPlacementTable";
import {
  FeaturedPlacementFilters,
  FeaturedPlacementSummaryCards,
  type FeaturedPlacementStatusFilter,
  type FeaturedPlacementTypeFilter,
} from "@/components/admin/featured/AdminFeaturedPlacementControls";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { validateFeaturedPlacementInput } from "@/lib/featuredPlacementValidation";
import {
  createFeaturedPlacement,
  deleteFeaturedPlacement,
  getAdminFeaturedPlacements,
  updateFeaturedPlacement,
  updateFeaturedPlacementStatus,
} from "@/services/adminFeaturedPlacementService";
import type { FeaturedPlacement, FeaturedPlacementInput, FeaturedPlacementStatus } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

export function AdminFeaturedPlacementsPage() {
  const { user } = useAuth();
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeaturedPlacement | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeaturedPlacementStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<FeaturedPlacementTypeFilter>("all");

  useEffect(() => {
    let cancelled = false;
    getAdminFeaturedPlacements()
      .then((nextPlacements) => {
        if (!cancelled) setPlacements(nextPlacements);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load featured placements.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const filteredPlacements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return placements.filter((placement) => {
      const venue = venuesById.get(placement.venueId);
      if (statusFilter !== "all" && placement.status !== statusFilter) return false;
      if (typeFilter !== "all" && placement.placementType !== typeFilter) return false;
      if (!normalizedQuery) return true;
      return [venue?.name, venue?.city, venue?.area, placement.title, placement.description, placement.city, placement.area, placement.placementType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [placements, query, statusFilter, typeFilter, venuesById]);

  async function handleSave(input: FeaturedPlacementInput) {
    if (!user) return;
    setActionError(null);
    try {
      const saved = editing
        ? await updateFeaturedPlacement({ placementId: editing.id, placement: input, adminUserId: user.id })
        : await createFeaturedPlacement({ placement: input, adminUserId: user.id });
      setPlacements((current) => (editing ? current.map((placement) => (placement.id === saved.id ? saved : placement)) : [saved, ...current]));
      setEditing(null);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not save featured placement.");
    }
  }

  async function handleStatus(placement: FeaturedPlacement, status: FeaturedPlacementStatus) {
    if (!user) return;
    setActionError(null);
    try {
      const updated = await updateFeaturedPlacementStatus({ placementId: placement.id, status, adminUserId: user.id });
      setPlacements((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update featured placement.");
    }
  }

  async function handleDelete(placement: FeaturedPlacement) {
    setActionError(null);
    try {
      await deleteFeaturedPlacement(placement.id);
      setPlacements((current) => current.filter((item) => item.id !== placement.id));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not delete featured placement.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/featured">
      <PageMeta title="Featured Placements | nokta Admin" description="Manage featured placement campaigns." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Featured placements</h1>
            <p className="mt-2 text-sm text-[#8a7e72]">Create clearly labelled promotional placements.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/monetisation">Open monetisation</Link>
          </Button>
        </div>

        <FeaturedPlacementSummaryCards placements={placements} />
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}

        <AdminFeaturedPlacementForm
          key={editing?.id ?? "new"}
          placement={editing}
          venues={venues}
          isLoadingVenues={isLoadingVenues}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <FeaturedPlacementFilters
          query={query}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
        />

        {isLoading ? (
          <LoadingState message="Loading featured placements..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <AdminFeaturedPlacementTable
            placements={filteredPlacements}
            venuesById={venuesById}
            onEdit={setEditing}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        )}
      </div>
    </AdminPageShell>
  );
}
