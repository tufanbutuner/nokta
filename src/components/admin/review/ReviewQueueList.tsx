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
        <p className="text-[13px] text-muted-foreground">Nothing waiting in {formatReviewQueueChip(activeType).toLowerCase()}s.</p>
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
              "w-full border-b border-l-[3px] border-l-transparent px-4 py-[13px] text-left transition-colors hover:bg-card/60",
              selectedId === item.id && "border-l-clay-accent bg-card",
              item.decision !== "pending" && "opacity-[0.62]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <TypeChip type={item.type} />
                <span className="truncate text-[13.5px] font-semibold text-nokta-ink">{item.venueName}</span>
              </div>
              <span className="flex-none text-[11.5px] text-muted-foreground">{formatReviewQueueAge(item.createdAt)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-muted-foreground">{item.summary}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusPill item={item} />
              {item.qualifier ? <span className="truncate text-[11.5px] text-muted-foreground">{item.qualifier}</span> : null}
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
        "flex-none rounded-[5px] px-[7px] py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.3px]",
        type === "media" ? "bg-[oklch(0.93_0.03_250)] text-[oklch(0.36_0.08_250)]" : "bg-clay-accent/12 text-[#a44a30]",
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
        "rounded-full px-2 py-[2px] text-[11px] font-semibold capitalize",
        item.decision === "pending" && "bg-[oklch(0.96_0.045_75)] text-[oklch(0.36_0.08_75)]",
        item.decision === "approved" && "bg-[oklch(0.94_0.02_150)] text-[oklch(0.36_0.06_150)]",
        (item.decision === "rejected" || item.decision === "settled") && "bg-muted text-muted-foreground",
      )}
    >
      {item.status.replace(/_/g, " ")}{showAge ? ` · ${showAge}` : ""}
    </span>
  );
}
