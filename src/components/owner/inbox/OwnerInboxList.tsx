import { cn } from "@/lib/utils";
import { getOwnerInboxName, getOwnerInboxPreview, getOwnerInboxStatus, getOwnerInboxStatusTone, relativeAge } from "@/lib/ownerInbox";
import type { OwnerInboxItem } from "@/types/ownerInbox";
import type { Venue } from "@/types/venue";

export function OwnerInboxList({ items, selectedId, venuesById, onSelect, emptyState }: { items: OwnerInboxItem[]; selectedId: string | null; venuesById: Record<string, Venue | undefined>; onSelect: (item: OwnerInboxItem) => void; emptyState?: React.ReactNode }) {
  if (!items.length) {
    return <div className="p-8 text-center text-sm text-nokta-ink-muted">{emptyState ?? "No inbox items match these filters."}</div>;
  }

  return (
    <div>
      {items.map((item) => {
        const selected = item.id === selectedId;
        const tone = getOwnerInboxStatusTone(item);
        return (
          <button
            key={`${item.type}:${item.id}`}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "w-full border-b p-[13px_16px] text-left transition-colors hover:bg-nokta-surface/70 border-nokta-border",
              selected && "bg-nokta-chip-tint",
              tone === "closed" && "opacity-[0.62]",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn(
                "rounded-lg px-[7px] py-[2px] text-[11px] font-semibold uppercase tracking-[0.04em]",
                item.type === "booking" ? "bg-nokta-accent-solid/12 text-nokta-accent-dark" : "bg-nokta-info-tint text-nokta-info-ink",
              )}>{item.type}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{getOwnerInboxName(item)}</span>
              <span className="text-xs text-nokta-ink-muted">{relativeAge(item.createdAt)}</span>
            </div>
            <p className="mt-1 truncate text-[13px] leading-[1.45] text-nokta-ink-muted">{getOwnerInboxPreview(item)}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "rounded-full px-2 py-[2px] text-xs font-semibold",
                tone === "attention" && "bg-nokta-warn-tint text-nokta-warn-ink",
                tone === "progressed" && "bg-nokta-ok-tint text-nokta-ok-ink",
                tone === "closed" && "bg-nokta-track text-nokta-ink-muted",
              )}>{getOwnerInboxStatus(item)}</span>
              <span className="truncate text-xs text-nokta-ink-muted">{venuesById[item.venueId]?.name ?? "Venue"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
