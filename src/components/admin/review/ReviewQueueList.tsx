import { cn } from "@/lib/utils";
import { formatReviewQueueAge, formatReviewQueueChip } from "@/lib/adminReviewQueueLabels";
import type { ReviewQueueItem, ReviewQueueType } from "@/types/adminReviewQueue";

export function ReviewQueueList({
  items,
  selectedId,
  activeType,
  onSelect,
}: {
  items: ReviewQueueItem[];
  selectedId: string | null;
  activeType: ReviewQueueType;
  onSelect: (item: ReviewQueueItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-nokta-ink-muted">Nothing waiting in {formatReviewQueueChip(activeType).toLowerCase()}s.</p>
      </div>
    );
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "w-full border-b px-4 py-[13px] text-left transition-colors hover:bg-nokta-surface/60 border-nokta-border",
              selectedId === item.id && "bg-nokta-chip-tint",
              item.decision !== "pending" && "opacity-[0.62]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <TypeChip type={item.type} />
                <span className="truncate text-sm font-semibold text-nokta-ink">{item.venueName}</span>
              </div>
              <span className="flex-none text-xs text-nokta-ink-muted">{formatReviewQueueAge(item.createdAt)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-nokta-ink-muted">{item.summary}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusPill item={item} />
              {item.qualifier ? <span className="truncate text-xs text-nokta-ink-muted">{item.qualifier}</span> : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TypeChip({ type }: { type: ReviewQueueType }) {
  return (
    <span
      className={cn(
        "flex-none rounded-lg px-[7px] py-[2px] text-[11px] font-semibold uppercase tracking-[0.04em]",
        type === "media" ? "bg-nokta-info-tint text-nokta-info-ink" : "bg-nokta-accent-solid/12 text-nokta-accent-dark",
      )}
    >
      {formatReviewQueueChip(type)}
    </span>
  );
}

export function StatusPill({ item, showAge }: { item: ReviewQueueItem; showAge?: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-[2px] text-xs font-semibold capitalize",
        item.decision === "pending" && "bg-nokta-warn-tint text-nokta-warn-ink",
        item.decision === "approved" && "bg-nokta-ok-tint text-nokta-ok-ink",
        (item.decision === "rejected" || item.decision === "settled") && "bg-nokta-track text-nokta-ink-muted",
      )}
    >
      {item.status.replace(/_/g, " ")}{showAge ? ` · ${showAge}` : ""}
    </span>
  );
}
