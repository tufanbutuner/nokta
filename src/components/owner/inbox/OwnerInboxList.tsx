import { cn } from "@/lib/utils";
import { getOwnerInboxName, getOwnerInboxPreview, getOwnerInboxStatus, getOwnerInboxStatusTone, relativeAge } from "@/lib/ownerInbox";
import type { OwnerInboxItem } from "@/types/ownerInbox";
import type { Venue } from "@/types/venue";

export function OwnerInboxList({ items, selectedId, venuesById, onSelect, emptyState }: { items: OwnerInboxItem[]; selectedId: string | null; venuesById: Record<string, Venue | undefined>; onSelect: (item: OwnerInboxItem) => void; emptyState?: React.ReactNode }) {
  if (!items.length) {
    return <div className="p-8 text-center text-[13px] text-muted-foreground">{emptyState ?? "No inbox items match these filters."}</div>;
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
              "w-full border-b p-[13px_16px] text-left transition-colors hover:bg-card/70",
              selected && "border-l-[3px] border-l-clay-accent bg-card pl-[13px]",
              tone === "closed" && "opacity-[0.62]",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn(
                "rounded-[5px] px-[7px] py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.3px]",
                item.type === "booking" ? "bg-clay-accent/12 text-[#a44a30]" : "bg-[oklch(0.93_0.03_250)] text-[oklch(0.36_0.08_250)]",
              )}>{item.type}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{getOwnerInboxName(item)}</span>
              <span className="text-[11.5px] text-muted-foreground">{relativeAge(item.createdAt)}</span>
            </div>
            <p className="mt-1 truncate text-[12.5px] leading-[1.45] text-muted-foreground">{getOwnerInboxPreview(item)}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "rounded-full px-2 py-[2px] text-[11px] font-semibold",
                tone === "attention" && "bg-[oklch(0.96_0.045_75)] text-[oklch(0.36_0.08_75)]",
                tone === "progressed" && "bg-[oklch(0.94_0.02_150)] text-[oklch(0.36_0.06_150)]",
                tone === "closed" && "bg-muted text-muted-foreground",
              )}>{getOwnerInboxStatus(item)}</span>
              <span className="truncate text-[11.5px] text-muted-foreground">{venuesById[item.venueId]?.name ?? "Venue"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
