import { Link } from "react-router-dom";
import { getProfileCompletenessScore, getProfileGaps, type ProfileGap } from "@/lib/profileCompleteness";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

const ROW_CLASS = "flex items-center justify-between gap-2 rounded-[9px] border border-nokta-row-border px-[11px] py-[9px] text-left text-[13px] text-nokta-ink transition-colors hover:bg-nokta-hover-row";

export function OwnerProfileStrengthCard({
  venue,
  subscription,
  onFocusField,
}: {
  venue: Venue;
  subscription: VenueSubscription | null;
  onFocusField?: (field: NonNullable<ProfileGap["field"]>) => void;
}) {
  const score = getProfileCompletenessScore(venue, subscription);
  const gaps = getProfileGaps(venue, subscription);

  return (
    <section className="rounded-[14px] border border-nokta-border bg-white p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-nokta-ink">Profile strength</h2>
        <span className="text-[22px] font-semibold tracking-[-0.5px] text-nokta-ink">{score}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-nokta-track">
        <div className="h-full rounded-full bg-clay-accent transition-[width]" style={{ width: `${score}%` }} />
      </div>
      {gaps.length ? (
        <>
          <p className="mb-2 mt-3 text-[12.5px] text-nokta-ink-muted">{gaps.length === 1 ? "One thing left:" : `${countWord(gaps.length)} things left:`}</p>
          <div className="flex flex-col gap-2">
            {gaps.map((gap) => gap.target === "profile" ? (
              <button key={gap.id} type="button" className={`${ROW_CLASS} w-full cursor-pointer`} onClick={() => gap.field && onFocusField?.(gap.field)}>
                {gap.label}
                <span aria-hidden="true" className="text-clay-accent">→</span>
              </button>
            ) : (
              <Link key={gap.id} to={gap.target === "plan" ? `/owner/venues/${venue.slug}/performance` : `/owner/venues/${venue.slug}/${gap.target}`} className={ROW_CLASS}>
                {gap.label}
                <span aria-hidden="true" className="text-clay-accent">→</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function countWord(count: number) {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six"][count] ?? String(count);
}
