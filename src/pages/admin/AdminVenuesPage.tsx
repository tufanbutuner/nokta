import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { WorkspacePageHeader, workspacePrimaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { AdminVenueFilters } from "@/components/admin/venues/AdminVenueFilters";
import { AdminVenueTable } from "@/components/admin/venues/AdminVenueTable";
import type { AdminVenueQualityFilter, AdminVenueVerificationFilter } from "@/components/admin/venues/AdminVenueFilters";
import { ErrorState } from "@/components/state/ErrorState";
import { EmptyState } from "@/components/state/EmptyState";
import { LoadingState } from "@/components/state/LoadingState";
import { useVenues } from "@/hooks/useVenues";
import { DEFAULT_CITY } from "@/lib/cities";
import { getVenueQuality } from "@/lib/venueQuality";

export function AdminVenuesPage() {
  const { venues, isLoading, error } = useVenues();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [verificationStatus, setVerificationStatus] = useState<AdminVenueVerificationFilter>("all");
  const [qualityLevel, setQualityLevel] = useState<AdminVenueQualityFilter>("all");
  const filteredVenues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return venues.filter((venue) => {
      const matchesQuery =
        !normalizedQuery ||
        [venue.name, venue.country, venue.city, venue.area, venue.postcode, venue.address].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesVerification = verificationStatus === "all" || venue.verificationStatus === verificationStatus;
      const matchesQuality = qualityLevel === "all" || getVenueQuality(venue).level === qualityLevel;
      const matchesCity = venue.city === city;

      return matchesCity && matchesQuery && matchesVerification && matchesQuality;
    });
  }, [city, qualityLevel, query, venues, verificationStatus]);

  if (isLoading) {
    return (
      <AdminPageShell activePath="/admin/venues">
        <div className="py-20">
          <LoadingState message="Loading admin venues..." />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell activePath="/admin/venues">
        <div className="py-20">
          <ErrorState message={error} />
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell activePath="/admin/venues">
      <div className="space-y-6">
        <WorkspacePageHeader
          title="Venues"
          description="Create venues, edit catalogue details and maintain verification data."
          actions={<Link to="/admin/venues/new" className={workspacePrimaryActionClass}>New venue</Link>}
        />

        <section aria-label="Filter venues" className="rounded-xl border border-nokta-border bg-nokta-surface p-4">
          <AdminVenueFilters
            query={query}
            city={city}
            verificationStatus={verificationStatus}
            qualityLevel={qualityLevel}
            onQueryChange={setQuery}
            onCityChange={setCity}
            onVerificationStatusChange={setVerificationStatus}
            onQualityLevelChange={setQualityLevel}
          />
        </section>

        <div className="space-y-3">
          <p className="text-sm text-nokta-ink-muted">Showing {filteredVenues.length} of {venues.length} venues</p>
          {filteredVenues.length ? (
            <AdminVenueTable venues={filteredVenues} />
          ) : (
            <EmptyState title="No venues match these filters" description="Adjust the search or filters to continue managing venues." />
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
