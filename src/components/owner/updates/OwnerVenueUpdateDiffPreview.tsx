import { formatDiffValue, getVenueUpdateDiff } from "@/lib/venueUpdateDiff";
import type { VenueProfileUpdateChanges } from "@/types/venueUpdateRequests";

export function OwnerVenueUpdateDiffPreview({ original, requested }: { original: VenueProfileUpdateChanges; requested: VenueProfileUpdateChanges }) {
  const diff = getVenueUpdateDiff({ original, requested });
  if (!diff.length) return <div className="rounded-lg border bg-background/60 p-4 text-sm text-muted-foreground">No changes yet.</div>;

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr><th className="px-3 py-2">Field</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Requested</th></tr>
        </thead>
        <tbody className="divide-y">
          {diff.map((item) => <tr key={item.field}><td className="px-3 py-3 font-medium">{item.label}</td><td className="px-3 py-3 text-muted-foreground">{formatDiffValue(item.before)}</td><td className="px-3 py-3">{formatDiffValue(item.after)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
