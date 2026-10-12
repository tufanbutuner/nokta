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
    <section className="rounded-xl border border-nokta-warn-line bg-nokta-warn-tint px-[15px] py-[14px]">
      <h2 className="text-sm font-semibold text-nokta-ink">{changes.length} unpublished change{changes.length === 1 ? "" : "s"}</h2>
      <ul className="mt-2 space-y-1">
        {changes.map((change) => (
          <li key={change.id} className="text-xs leading-[1.45] text-nokta-ink">{change.label}</li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={onPublish} disabled={isPublishing || !canPublish} className="h-9 flex-1 text-[13px]">
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard} disabled={isPublishing} className="h-9 text-[13px]">Discard</Button>
      </div>
      {!canPublish ? <p className="mt-2 text-xs text-nokta-bad-ink">Fix the highlighted items before publishing.</p> : null}
    </section>
  );
}

export function PublicPagePreview({ sections, items }: { sections: VenueMenuSection[]; items: VenueMenuItem[] }) {
  const liveItems = items.filter((item) => item.isLive);

  return (
    <section className="rounded-2xl border bg-nokta-surface px-[15px] py-[14px] border-nokta-border">
      <h2 className="text-sm font-semibold text-nokta-ink">Public page preview</h2>
      <div className="mt-3 rounded-xl border bg-nokta-track p-3 border-nokta-border">
        {liveItems.length ? (
          sections.map((section) => {
            const sectionItems = liveItems.filter((item) => item.sectionId === section.id);
            if (!sectionItems.length) return null;
            return (
              <div key={section.id} className="mb-3 last:mb-0">
                <h3 className="text-xs font-semibold uppercase text-nokta-ink">{section.name}</h3>
                <ul className="mt-1.5 space-y-1">
                  {sectionItems.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="truncate text-nokta-ink">{item.name || "Untitled item"}</span>
                      <span className="flex-none font-medium text-nokta-ink">{formatPenceAsPrice(item.pricePence)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-nokta-ink-muted">Nothing is live yet, so your page shows no menu.</p>
        )}
      </div>
    </section>
  );
}

export function NoReviewNotice() {
  return (
    <section className="rounded-xl border border-nokta-ok-line bg-nokta-ok-tint px-[15px] py-[14px]">
      <h2 className="text-sm font-semibold text-nokta-ok-ink">Prices publish instantly</h2>
      <p className="mt-1.5 text-xs leading-[1.55] text-nokta-ok-ink">
        Menu items, prices and menu links are yours to change — no review. Name, address, category and opening hours still go to nokta for approval.
      </p>
    </section>
  );
}
