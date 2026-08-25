import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminVenueFilters } from "@/components/admin/venues/AdminVenueFilters";
import { AdminVenueTable } from "@/components/admin/venues/AdminVenueTable";
import type { AdminVenueQualityFilter, AdminVenueVerificationFilter } from "@/components/admin/venues/AdminVenueFilters";
import { ErrorState } from "@/components/state/ErrorState";
import { EmptyState } from "@/components/state/EmptyState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVenues } from "@/hooks/useVenues";
import { getVenueQuality } from "@/lib/venueQuality";

export function AdminVenuesPage() {
  const { venues, isLoading, error } = useVenues();
  const [query, setQuery] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<AdminVenueVerificationFilter>("all");
  const [qualityLevel, setQualityLevel] = useState<AdminVenueQualityFilter>("all");
  const filteredVenues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return venues.filter((venue) => {
      const matchesQuery =
        !normalizedQuery ||
        [venue.name, venue.area, venue.postcode, venue.address].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesVerification = verificationStatus === "all" || venue.verificationStatus === verificationStatus;
      const matchesQuality = qualityLevel === "all" || getVenueQuality(venue).level === qualityLevel;

      return matchesQuery && matchesVerification && matchesQuality;
    });
  }, [qualityLevel, query, venues, verificationStatus]);

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
      <div className="py-5">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Internal</p>
            <h1 className="mt-2 text-4xl font-semibold">Manage venues</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Create venues, edit catalogue details and maintain verification data.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/admin/venues/new">New venue</Link>
            </Button>
          </div>
        </div>

        <Card className="mb-5">
          <CardContent>
            <AdminVenueFilters
              query={query}
              verificationStatus={verificationStatus}
              qualityLevel={qualityLevel}
              onQueryChange={setQuery}
              onVerificationStatusChange={setVerificationStatus}
              onQualityLevelChange={setQualityLevel}
            />
          </CardContent>
        </Card>

        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredVenues.length} of {venues.length} venues
        </div>

        {filteredVenues.length ? (
          <AdminVenueTable venues={filteredVenues} />
        ) : (
          <EmptyState title="No venues match these filters" description="Adjust the search or filters to continue managing venues." />
        )}
      </div>
    </AdminPageShell>
  );
}
