import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MonetisationFilters, type MonetisationFilter } from "@/components/admin/monetisation/MonetisationFilters";
import { MonetisationHeader } from "@/components/admin/monetisation/MonetisationHeader";
import { MonetisationPipelineFunnel } from "@/components/admin/monetisation/MonetisationPipelineFunnel";
import { MonetisationSummaryCards } from "@/components/admin/monetisation/MonetisationSummaryCards";
import { MonetisationVenueTable } from "@/components/admin/monetisation/MonetisationVenueTable";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { getFeaturedEligibilityRecommendation } from "@/lib/commercialEligibility";
import { formatPartnerTier, formatMonetisationStatus } from "@/lib/monetisationLabels";
import { getMonetisationSummary } from "@/lib/monetisationSummary";
import { updateVenueMonetisationStatus } from "@/services/adminMonetisationService";
import type { MonetisationStatus } from "@/types/monetisation";
import type { Venue } from "@/types/venue";
import { useVenues } from "@/hooks/useVenues";

export function MonetisationDashboardPage() {
  const { venues, isLoading, error } = useVenues();
  const [dashboardVenues, setDashboardVenues] = useState<Venue[]>([]);
  const [activeFilter, setActiveFilter] = useState<MonetisationFilter>("all");
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setDashboardVenues(venues);
  }, [venues]);

  const summary = useMemo(() => getMonetisationSummary(dashboardVenues), [dashboardVenues]);
  const filteredVenues = useMemo(() => filterVenuesByMonetisation(dashboardVenues, activeFilter), [activeFilter, dashboardVenues]);

  async function handleStatusChange(venue: Venue, status: MonetisationStatus) {
    const actionKey = `${venue.id}:${status}`;
    const previousStatus = venue.monetisationStatus;

    setUpdatingAction(actionKey);
    setActionError(null);
    setDashboardVenues((currentVenues) =>
      currentVenues.map((currentVenue) => (currentVenue.id === venue.id ? { ...currentVenue, monetisationStatus: status } : currentVenue)),
    );

    try {
      await updateVenueMonetisationStatus({ venueId: venue.id, status, notes: venue.monetisationNotes });
    } catch (caughtError) {
      setDashboardVenues((currentVenues) =>
        currentVenues.map((currentVenue) => (currentVenue.id === venue.id ? { ...currentVenue, monetisationStatus: previousStatus } : currentVenue)),
      );
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update monetisation status.");
    } finally {
      setUpdatingAction(null);
    }
  }

  function handleExport() {
    exportVenuesToCsv(filteredVenues);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-clay-50 font-['Outfit'] text-clay-600">
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar activePath="/admin/monetisation" />
        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="py-20">
              <LoadingState message="Loading monetisation dashboard..." />
            </div>
          ) : error ? (
            <div className="py-20">
              <ErrorState message={error} />
            </div>
          ) : (
            <div className="mx-auto grid max-w-[1440px] gap-5">
              <MonetisationHeader venueCount={dashboardVenues.length} noteVenueId={filteredVenues[0]?.id} onExport={handleExport} />
              {actionError ? <Alert className="border-clay-400/20 bg-clay-400/10 text-clay-600">{actionError}</Alert> : null}
              <MonetisationSummaryCards summary={summary} />
              <MonetisationPipelineFunnel summary={summary} />
              <section className="grid gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-['Outfit'] text-xs font-semibold text-clay-600">Commercial pipeline</h2>
                    <p className="mt-1 text-[13px] text-[#8a7e72]">
                      Showing {filteredVenues.length} of {dashboardVenues.length} venues
                    </p>
                  </div>
                  <MonetisationFilters activeFilter={activeFilter} onChange={setActiveFilter} />
                </div>
                {filteredVenues.length ? (
                  <MonetisationVenueTable venues={filteredVenues} updatingAction={updatingAction} onStatusChange={handleStatusChange} />
                ) : (
                  <div className="rounded-xl border border-black/[0.04] bg-white">
                    <EmptyState title="No venues match this commercial filter" description="Adjust the filter to continue reviewing venue opportunities." />
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function filterVenuesByMonetisation(venues: Venue[], filter: MonetisationFilter): Venue[] {
  if (filter === "all") {
    return venues;
  }

  return venues.filter((venue) => {
    if (filter === "claimed") return venue.isClaimed;
    if (filter === "featured-eligible") return venue.featuredEligible;
    if (filter === "in-pipeline") return ["contacted", "interested", "trial"].includes(venue.monetisationStatus);
    if (filter === "paying" || filter === "not-contacted" || filter === "churned") return venue.monetisationStatus === filter;
    return false;
  });
}

function exportVenuesToCsv(venues: Venue[]) {
  const headers = ["Venue", "Area", "Claimed", "Tier", "Status", "Featured eligible", "Featured recommendation", "Notes"];
  const rows = venues.map((venue) => {
    const recommendation = getFeaturedEligibilityRecommendation(venue);

    return [
      venue.name,
      venue.area,
      venue.isClaimed ? "Yes" : "No",
      formatPartnerTier(venue.partnerTier),
      formatMonetisationStatus(venue.monetisationStatus),
      venue.featuredEligible ? "Yes" : "No",
      recommendation.eligible ? "Eligible" : "Needs work",
      venue.monetisationNotes ?? "",
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `sheesha-monetisation-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
