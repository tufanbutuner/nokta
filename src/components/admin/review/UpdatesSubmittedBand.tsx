import { cn } from "@/lib/utils";
import { formatDiffValue, getVenueUpdateDiff } from "@/lib/venueUpdateDiff";
import type { VenueUpdateRequest } from "@/types/venueUpdateRequests";

export function UpdatesSubmittedBand({ request }: { request: VenueUpdateRequest }) {
  const diff = getVenueUpdateDiff({ original: request.originalSnapshot, requested: request.requestedChanges });

  if (!diff.length) {
    return <p className="rounded-xl border bg-card px-4 py-3 text-[13px] text-muted-foreground">This request has no field changes.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden gap-[14px] border-b bg-[oklch(0.97_0.012_60)] px-4 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground md:grid md:grid-cols-[minmax(110px,150px)_minmax(0,1fr)_minmax(0,1fr)]">
        <span>Field</span>
        <span>Current</span>
        <span>Requested</span>
      </div>
      {diff.map((item, index) => (
        <div
          key={item.field}
          className={cn(
            "gap-x-[14px] gap-y-1 px-4 py-3 md:grid md:grid-cols-[minmax(110px,150px)_minmax(0,1fr)_minmax(0,1fr)]",
            index < diff.length - 1 && "border-b",
          )}
        >
          <span className="block text-[12.5px] font-medium text-nokta-ink">{item.label}</span>
          <span className="mt-1 block md:mt-0">
            <span className="text-[10.5px] uppercase tracking-[0.5px] text-muted-foreground md:hidden">Current </span>
            <DiffValue value={item.before} />
          </span>
          <span className="mt-1 block md:mt-0">
            <span className="text-[10.5px] uppercase tracking-[0.5px] text-muted-foreground md:hidden">Requested </span>
            <DiffValue value={item.after} isRequested />
          </span>
        </div>
      ))}
    </div>
  );
}

function DiffValue({ value, isRequested }: { value: unknown; isRequested?: boolean }) {
  const formatted = formatDiffValue(value);
  const isUnset = formatted === "Not set";

  if (isUnset) {
    return <span className="text-[12.5px] italic text-[oklch(0.62_0.02_42)]">Not set</span>;
  }

  return (
    <span
      className={cn(
        "whitespace-pre-wrap break-words text-[12.5px]",
        isRequested ? "rounded-[3px] bg-[oklch(0.96_0.045_75)] px-[3px] font-semibold text-nokta-ink" : "text-muted-foreground",
      )}
    >
      {formatted}
    </span>
  );
}
