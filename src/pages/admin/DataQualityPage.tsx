import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataQualityEmptyState } from "@/components/admin/data-quality/DataQualityEmptyState";
import { DataQualityFilters } from "@/components/admin/data-quality/DataQualityFilters";
import { DataQualitySummaryCards } from "@/components/admin/data-quality/DataQualitySummaryCards";
import { DataQualityVenueTable } from "@/components/admin/data-quality/DataQualityVenueTable";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useVenues } from "@/hooks/useVenues";
import { filterVenuesByQualityIssue, getVenueQuality, getVenueQualitySummary } from "@/lib/venueQuality";
import type { DataQualityFilter } from "@/lib/venueQuality";
import type { Venue } from "@/types/venue";

export function DataQualityPage() {
  const { venues, isLoading, error } = useVenues();
  const [activeFilter, setActiveFilter] = useState<DataQualityFilter>("all");
  const summary = useMemo(() => getVenueQualitySummary(venues), [venues]);
  const filteredVenues = useMemo(() => filterVenuesByQualityIssue(venues, activeFilter), [activeFilter, venues]);

  if (isLoading) {
    return (
      <AdminPageShell activePath="/admin/data-quality">
        <div className="py-20">
          <LoadingState message="Loading data quality..." />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell activePath="/admin/data-quality">
        <div className="py-20">
          <ErrorState message={error} />
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell activePath="/admin/data-quality">
      <div className="py-5">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Internal</p>
            <h1 className="mt-2 text-4xl font-semibold">Venue Data Quality</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Audit missing fields, source strength, verification status and coordinate quality before public launch.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => exportQualityCsv(venues)} disabled={!venues.length}>
              <Download className="mr-2 h-4 w-4" />
              Export issues CSV
            </Button>
          </div>
        </div>

        <DataQualitySummaryCards summary={summary} />

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Venue audit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {filteredVenues.length} of {venues.length} venues
              </p>
            </div>
            <DataQualityFilters activeFilter={activeFilter} onChange={setActiveFilter} />
          </div>

          {filteredVenues.length ? <DataQualityVenueTable venues={filteredVenues} /> : <DataQualityEmptyState />}
        </section>
      </div>
    </AdminPageShell>
  );
}

function exportQualityCsv(venues: Venue[]) {
  const rows = venues.map((venue) => {
    const quality = getVenueQuality(venue);

    return [
      venue.id,
      venue.name,
      venue.area,
      venue.verificationStatus,
      venue.businessStatus,
      String(quality.score),
      quality.level,
      quality.issues.map((issue) => issue.label).join("; "),
    ];
  });
  const csv = [["id", "name", "area", "verificationStatus", "businessStatus", "qualityScore", "qualityLevel", "issues"], ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "venue-quality-issues.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  return `"${value.split('"').join('""')}"`;
}
