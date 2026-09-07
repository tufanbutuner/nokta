import { Button } from "@/components/ui/button";
import { formatPenceAsPrice } from "@/lib/venueMenuValidation";
import type { VenueMenuChangeSummary, VenueMenuItem, VenueMenuSection } from "@/types/venueMenu";

export function UnpublishedChangesTray({
  changes,
  isPublishing,
  canPublish,
  onPublish,
  onDiscard,
}: {
  changes: VenueMenuChangeSummary[];
  isPublishing: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onDiscard: () => void;
}) {
  if (!changes.length) return null;

  return (
    <section className="rounded-xl border border-[oklch(0.87_0.08_75)] bg-[oklch(0.96_0.045_75)] px-[15px] py-[14px]">
      <h2 className="text-[13px] font-semibold text-nokta-ink">{changes.length} unpublished change{changes.length === 1 ? "" : "s"}</h2>
      <ul className="mt-2 space-y-1">
        {changes.map((change) => (
          <li key={change.id} className="text-xs leading-[1.45] text-nokta-ink">{change.label}</li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={onPublish} disabled={isPublishing || !canPublish} className="h-[33px] flex-1 text-[12.5px]">
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard} disabled={isPublishing} className="h-[33px] text-[12.5px]">Discard</Button>
      </div>
      {!canPublish ? <p className="mt-2 text-xs text-destructive">Fix the highlighted items before publishing.</p> : null}
    </section>
  );
}

export function PublicPagePreview({ sections, items }: { sections: VenueMenuSection[]; items: VenueMenuItem[] }) {
  const liveItems = items.filter((item) => item.isLive);

  return (
    <section className="rounded-xl border bg-card px-[15px] py-[14px]">
      <h2 className="text-[10px] font-semibold uppercase tracking-[1.6px] text-muted-foreground">Public page preview</h2>
      <div className="mt-3 rounded-[10px] border bg-[oklch(0.96_0.02_55)] p-3">
        {liveItems.length ? (
          sections.map((section) => {
            const sectionItems = liveItems.filter((item) => item.sectionId === section.id);
            if (!sectionItems.length) return null;
            return (
              <div key={section.id} className="mb-3 last:mb-0">
                <h3 className="text-xs font-semibold uppercase text-nokta-ink">{section.name}</h3>
                <ul className="mt-1.5 space-y-1">
                  {sectionItems.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="truncate text-nokta-ink">{item.name || "Untitled item"}</span>
                      <span className="flex-none font-medium text-nokta-ink">{formatPenceAsPrice(item.pricePence)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-[12.5px] text-muted-foreground">Nothing is live yet, so your page shows no menu.</p>
        )}
      </div>
    </section>
  );
}

export function NoReviewNotice() {
  return (
    <section className="rounded-xl border border-[oklch(0.86_0.06_150)] bg-[oklch(0.96_0.03_150)] px-[15px] py-[14px]">
      <h2 className="text-[13px] font-semibold text-[oklch(0.32_0.06_150)]">Prices publish instantly</h2>
      <p className="mt-1.5 text-xs leading-[1.55] text-[oklch(0.34_0.06_150)]">
        Menu items, prices and menu links are yours to change — no review. Name, address, category and opening hours still go to nokta for approval.
      </p>
    </section>
  );
}
