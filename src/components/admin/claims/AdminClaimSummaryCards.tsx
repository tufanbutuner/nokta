import { Card, CardContent } from "@/components/ui/card";
import type { VenueClaimRequest, VenueClaimRequestStatus } from "@/types/venueClaims";

const STATUSES: VenueClaimRequestStatus[] = ["pending", "approved", "rejected", "cancelled"];

export function AdminClaimSummaryCards({ claims }: { claims: VenueClaimRequest[] }) {
  const counts = claims.reduce<Record<VenueClaimRequestStatus, number>>(
    (nextCounts, claim) => ({ ...nextCounts, [claim.status]: nextCounts[claim.status] + 1 }),
    { pending: 0, approved: 0, rejected: 0, cancelled: 0 },
  );

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <MetricCard label="Total claims" value={claims.length} />
      {STATUSES.map((status) => (
        <MetricCard key={status} label={`${status[0].toUpperCase()}${status.slice(1)}`} value={counts[status]} />
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
