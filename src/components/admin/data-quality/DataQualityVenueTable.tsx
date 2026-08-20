import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { DataQualityIssueBadge } from "@/components/admin/data-quality/DataQualityIssueBadge";
import { Card, CardContent } from "@/components/ui/card";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { getVenueQuality } from "@/lib/venueQuality";
import type { BusinessStatus, Venue } from "@/types/venue";

const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  open: "Open",
  "temporarily-closed": "Temporarily closed",
  "permanently-closed": "Permanently closed",
  unknown: "Unknown",
};

const QUALITY_LEVEL_LABELS = {
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

export function DataQualityVenueTable({ venues }: { venues: Venue[] }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Business status</th>
                <th className="px-4 py-3 font-medium">Quality</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => {
                const quality = getVenueQuality(venue);
                const topIssues = quality.issues.slice(0, 3);

                return (
                  <tr key={venue.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium">{venue.name}</div>
                      <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{venue.address}</div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{venue.area}</td>
                    <td className="px-4 py-4">
                      <VenueVerificationBadge status={venue.verificationStatus} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{BUSINESS_STATUS_LABELS[venue.businessStatus]}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">{quality.score}</div>
                      <div className="text-xs text-muted-foreground">{QUALITY_LEVEL_LABELS[quality.level]}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">{quality.issues.length} issues</div>
                      <div className="flex max-w-md flex-wrap gap-2">
                        {topIssues.map((issue) => (
                          <DataQualityIssueBadge key={issue.key} issue={issue} />
                        ))}
                        {quality.issues.length > topIssues.length ? (
                          <span className="text-xs text-muted-foreground">+{quality.issues.length - topIssues.length} more</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link className="inline-flex items-center gap-1 text-sm font-medium hover:underline" to={`/venues/${venue.slug}`}>
                        View
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
