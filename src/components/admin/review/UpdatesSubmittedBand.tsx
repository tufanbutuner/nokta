import { cn } from "@/lib/utils";
import { formatDiffValue, getVenueUpdateDiff } from "@/lib/venueUpdateDiff";
import type { VenueUpdateRequest } from "@/types/venueUpdateRequests";

export function UpdatesSubmittedBand({ request }: { request: VenueUpdateRequest }) {
  const diff = getVenueUpdateDiff({ original: request.originalSnapshot, requested: request.requestedChanges });

  if (!diff.length) {
    return <p className="rounded-2xl border bg-nokta-surface px-4 py-3 text-sm text-nokta-ink-muted border-nokta-border">This request has no field changes.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border">
      <div className="hidden gap-[14px] border-b bg-nokta-hover px-4 py-[9px] text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted md:grid md:grid-cols-[minmax(110px,150px)_minmax(0,1fr)_minmax(0,1fr)] border-nokta-border">
        <span>Field</span>
        <span>Current</span>
        <span>Requested</span>
      </div>
      {diff.map((item, index) => (
        <div
          key={item.field}
          className={cn(
            "gap-x-[14px] gap-y-1 px-4 py-3 md:grid md:grid-cols-[minmax(110px,150px)_minmax(0,1fr)_minmax(0,1fr)]",
            index < diff.length - 1 && "border-b border-nokta-border",
          )}
        >
          <span className="block text-[13px] font-medium text-nokta-ink">{item.label}</span>
          <span className="mt-1 block md:mt-0">
            <span className="text-[11px] uppercase tracking-[0.04em] text-nokta-ink-muted md:hidden">Current </span>
            <DiffValue value={item.before} />
          </span>
          <span className="mt-1 block md:mt-0">
            <span className="text-[11px] uppercase tracking-[0.04em] text-nokta-ink-muted md:hidden">Requested </span>
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
    return <span className="text-[13px] italic text-nokta-ink-muted">Not set</span>;
  }

  return (
    <span
      className={cn(
        "whitespace-pre-wrap break-words text-[13px]",
        isRequested ? "rounded-[3px] bg-nokta-warn-tint px-[3px] font-semibold text-nokta-ink" : "text-nokta-ink-muted",
      )}
    >
      {formatted}
    </span>
  );
}
