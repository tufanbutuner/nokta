import { ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { ClaimedVenueBadge } from "@/components/admin/monetisation/ClaimedVenueBadge";
import { MonetisationStatusBadge } from "@/components/admin/monetisation/MonetisationStatusBadge";
import { PartnerTierBadge } from "@/components/admin/monetisation/PartnerTierBadge";
import { Card, CardContent } from "@/components/ui/card";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { getVenueQuality } from "@/lib/venueQuality";
import type { Venue } from "@/types/venue";

const QUALITY_LABELS = {
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

export function AdminVenueTable({ venues }: { venues: Venue[] }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Postcode</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Claimed</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Commercial</th>
                <th className="px-4 py-3 font-medium">Quality</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => {
                const quality = getVenueQuality(venue);

                return (
                  <tr key={venue.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium">{venue.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{venue.id}</div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{venue.city}</td>
                    <td className="px-4 py-4 text-muted-foreground">{venue.area}</td>
                    <td className="px-4 py-4 text-muted-foreground">{venue.postcode}</td>
                    <td className="px-4 py-4">
                      <VenueVerificationBadge status={venue.verificationStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <ClaimedVenueBadge claimed={venue.isClaimed} />
                    </td>
                    <td className="px-4 py-4">
                      <PartnerTierBadge tier={venue.partnerTier} />
                    </td>
                    <td className="px-4 py-4">
                      <MonetisationStatusBadge status={venue.monetisationStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">{quality.score}</div>
                      <div className="text-xs text-muted-foreground">{QUALITY_LABELS[quality.level]}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link className="inline-flex items-center gap-1 font-medium hover:underline" to={`/admin/venues/${venue.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <Link className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline" to={`/venues/${venue.slug}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Public
                        </Link>
                      </div>
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
