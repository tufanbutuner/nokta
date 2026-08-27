import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { MonetisationFilters, type MonetisationFilter } from "@/components/admin/monetisation/MonetisationFilters";
import { MonetisationHeader } from "@/components/admin/monetisation/MonetisationHeader";
import { MonetisationPipelineFunnel } from "@/components/admin/monetisation/MonetisationPipelineFunnel";
import { MonetisationSummaryCards } from "@/components/admin/monetisation/MonetisationSummaryCards";
import { MonetisationVenueTable } from "@/components/admin/monetisation/MonetisationVenueTable";
import { CitySelector } from "@/components/search/CitySelector";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { getFeaturedEligibilityRecommendation } from "@/lib/commercialEligibility";
import { DEFAULT_CITY } from "@/lib/cities";
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
  const [city, setCity] = useState(DEFAULT_CITY);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setDashboardVenues(venues);
  }, [venues]);

  const cityVenues = useMemo(() => dashboardVenues.filter((venue) => venue.city === city), [city, dashboardVenues]);
  const summary = useMemo(() => getMonetisationSummary(cityVenues), [cityVenues]);
  const summaryByCity = useMemo(() => getMonetisationSummaryByCity(dashboardVenues), [dashboardVenues]);
  const filteredVenues = useMemo(() => filterVenuesByMonetisation(cityVenues, activeFilter), [activeFilter, cityVenues]);

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
    <AdminPageShell activePath="/admin/monetisation">
      {isLoading ? (
        <div className="py-20">
          <LoadingState message="Loading monetisation dashboard..." />
        </div>
      ) : error ? (
        <div className="py-20">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="grid gap-5 py-5">
          <MonetisationHeader venueCount={cityVenues.length} noteVenueId={filteredVenues[0]?.id} onExport={handleExport} />
          <section className="rounded-xl border border-black/[0.04] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-primary text-xs font-semibold text-clay-600">Featured placements</h2>
                <p className="mt-1 text-[13px] text-[#8a7e72]">Manage promoted homepage, city and discover placements.</p>
              </div>
              <Link to="/admin/featured" className="text-sm font-medium text-clay-600 hover:text-sheesh-ink">
                Open featured manager
              </Link>
              <Link to="/admin/enquiries" className="text-sm font-medium text-clay-600 hover:text-sheesh-ink">
                Open enquiries
              </Link>
              <Link to="/admin/offers" className="text-sm font-medium text-clay-600 hover:text-sheesh-ink">
                Open offers
              </Link>
              <Link to="/admin/analytics" className="text-sm font-medium text-clay-600 hover:text-sheesh-ink">
                Open analytics
              </Link>
            </div>
          </section>
          {actionError ? <Alert className="border-clay-400/20 bg-clay-400/10 text-clay-600">{actionError}</Alert> : null}
          <MonetisationSummaryCards summary={summary} />
          <section className="rounded-xl border border-black/[0.04] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-primary text-xs font-semibold text-clay-600">City pipeline</h2>
                <p className="mt-1 text-[13px] text-[#8a7e72]">Review monetisation by city.</p>
              </div>
              <div className="w-full sm:w-56">
                <CitySelector id="monetisation-city-filter" value={city} onChange={setCity} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryByCity.map((item) => (
                <div key={item.city} className="rounded-lg border bg-clay-50 p-3 text-sm">
                  <div className="font-semibold text-clay-600">{item.city}</div>
                  <div className="mt-2 text-[#8a7e72]">{item.totalVenues} venues</div>
                  <div className="mt-1 text-[#8a7e72]">{item.claimedCount} claimed</div>
                  <div className="mt-1 text-[#8a7e72]">
                    {item.payingCount} paying · {item.interestedCount} interested
                  </div>
                </div>
              ))}
            </div>
          </section>
          <MonetisationPipelineFunnel summary={summary} />
          <section className="grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-primary text-xs font-semibold text-clay-600">Commercial pipeline</h2>
                <p className="mt-1 text-[13px] text-[#8a7e72]">
                  Showing {filteredVenues.length} of {cityVenues.length} venues in {city}
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
    </AdminPageShell>
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

function getMonetisationSummaryByCity(venues: Venue[]) {
  const summaries = new Map<string, { city: string; totalVenues: number; claimedCount: number; payingCount: number; interestedCount: number }>();

  for (const venue of venues) {
    const summary = summaries.get(venue.city) ?? {
      city: venue.city,
      totalVenues: 0,
      claimedCount: 0,
      payingCount: 0,
      interestedCount: 0,
    };

    summary.totalVenues += 1;
    summary.claimedCount += venue.isClaimed ? 1 : 0;
    summary.payingCount += venue.monetisationStatus === "paying" ? 1 : 0;
    summary.interestedCount += venue.monetisationStatus === "interested" ? 1 : 0;
    summaries.set(venue.city, summary);
  }

  return Array.from(summaries.values()).sort((first, second) => first.city.localeCompare(second.city));
}

function exportVenuesToCsv(venues: Venue[]) {
  const headers = ["Venue", "Country", "City", "Area", "Claimed", "Tier", "Status", "Featured eligible", "Featured recommendation", "Notes"];
  const rows = venues.map((venue) => {
    const recommendation = getFeaturedEligibilityRecommendation(venue);

    return [
      venue.name,
      venue.country,
      venue.city,
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
