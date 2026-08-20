import { Card, CardContent } from "@/components/ui/card";
import type { VenueQualitySummary } from "@/lib/venueQuality";
import type { ReactNode } from "react";

export function DataQualitySummaryCards({ summary }: { summary: VenueQualitySummary }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total venues" value={summary.totalVenues} />
        <MetricCard label="Open venues" value={summary.openCount} />
        <MetricCard label="Unknown status" value={summary.unknownBusinessStatusCount} tone={summary.unknownBusinessStatusCount ? "warning" : "default"} />
        <MetricCard label="Questionable coordinates" value={summary.questionableCoordinatesCount} tone={summary.questionableCoordinatesCount ? "danger" : "default"} />
      </div>

      <SectionCard title="Verification">
        <MetricPill label="Verified" value={summary.verifiedCount} />
        <MetricPill label="Partially verified" value={summary.partiallyVerifiedCount} />
        <MetricPill label="Unverified" value={summary.unverifiedCount} />
      </SectionCard>

      <SectionCard title="Missing data">
        <MetricPill label="Opening hours" value={summary.missingOpeningHoursCount} />
        <MetricPill label="Phone" value={summary.missingPhoneCount} />
        <MetricPill label="Website" value={summary.missingWebsiteCount} />
        <MetricPill label="Instagram" value={summary.missingInstagramCount} />
        <MetricPill label="Shisha price" value={summary.missingPriceCount} />
        <MetricPill label="Images" value={summary.missingImagesCount} />
      </SectionCard>

      <SectionCard title="Needs attention">
        <MetricPill label="Missing official source" value={summary.missingOfficialSourceCount} />
        <MetricPill label="Only third-party sourced" value={summary.thirdPartyOnlySourceCount} />
        <MetricPill label="Good quality" value={summary.goodQualityCount} />
        <MetricPill label="Needs work" value={summary.needsWorkQualityCount} />
        <MetricPill label="Poor quality" value={summary.poorQualityCount} />
      </SectionCard>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "text-red-700" : tone === "warning" ? "text-amber-800" : "text-foreground";

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 flex flex-wrap gap-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-2 font-semibold">{value}</span>
    </div>
  );
}
