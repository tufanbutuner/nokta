import { OUTLINE_BUTTON, PRIMARY_BUTTON, RecommendEyebrow, TEXT_LINK } from "@/components/recommendations/flow/RecommendChrome";
import { ROLE_COLORS, roleLabel, formatPickMeta } from "@/components/recommendations/flow/recommendPickMeta";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { RecommendPick } from "@/types/recommendFlow";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function RecommendResultsScreen({
  picks,
  summary,
  matchCount,
  isSaved,
  isSaving,
  onEdit,
  onSaveAll,
  onShare,
  onSwapWildcard,
  onRestart,
  onToggleSave,
  allMatchesHref,
}: {
  picks: RecommendPick[];
  summary: string;
  matchCount: number;
  isSaved: (venueId: string) => boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSaveAll: () => void;
  onShare: () => void;
  onSwapWildcard: () => void;
  onRestart: () => void;
  onToggleSave: (venueId: string) => void;
  allMatchesHref: string;
}) {
  return (
    <section className="relative z-10 flex flex-1 flex-col gap-[clamp(14px,2cqi,22px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(8px,2cqi,20px)] motion-safe:animate-[rdIn_.4s_both]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2.5">
          <RecommendEyebrow>Your three</RecommendEyebrow>
          <h1 className="text-[clamp(24px,4.6cqi,38px)] font-semibold leading-[1.08] tracking-[-1.1px] [text-wrap:pretty]">Three ways tonight could go.</h1>
          <p className="text-[13.5px] text-white/[.58]">
            {summary}{" "}
            <button type="button" className="font-semibold text-[#e0805f] transition-colors hover:text-white" onClick={onEdit}>
              Edit
            </button>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(OUTLINE_BUTTON, "h-10 rounded-[10px] px-4 text-[13.5px]")} disabled={isSaving} onClick={onSaveAll}>
            {isSaving ? "Saving…" : "Save all three"}
          </button>
          <button type="button" className={cn(OUTLINE_BUTTON, "h-10 rounded-[10px] px-4 text-[13.5px]")} onClick={onShare}>
            Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-[clamp(10px,1.4cqi,14px)]">
        {picks.map((pick) => {
          const emphasised = pick.role === "safe";
          const saved = isSaved(pick.venue.id);

          return (
            <article
              key={pick.venue.id}
              className={cn("flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-[clamp(13px,1.6cqi,18px)]", emphasised ? "border-clay-accent bg-[rgba(196,93,62,.14)]" : "border-white/[.13] bg-white/[.04]")}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.13em]" style={{ color: ROLE_COLORS[pick.role] }}>
                  {roleLabel(pick.role, pick.miles)}
                </span>
                <span className="whitespace-nowrap font-mono text-[12px] font-semibold text-white/55">{pick.match}</span>
              </div>

              <img src={getVenueImage(pick.venue)} alt={`${pick.venue.name} interior`} className="h-[clamp(74px,9cqi,104px)] w-full rounded-[10px] object-cover" />

              <div className="grid gap-1">
                <h2 className="text-[clamp(17px,2.1cqi,21px)] font-semibold leading-tight tracking-[-0.4px]">{pick.venue.name}</h2>
                <p className="text-[13px] text-white/60">{formatPickMeta(pick.venue, pick.miles)}</p>
              </div>

              <p className="text-[13.5px] leading-[1.45] text-white/[.82] [text-wrap:pretty]">{pick.reason}</p>

              <div className="mt-auto flex gap-2 pt-1">
                <Link to={`/venues/${pick.venue.slug}`} className={cn(PRIMARY_BUTTON, "h-10 flex-1 rounded-[9px] text-[13.5px]")}>
                  View venue
                </Link>
                <button
                  type="button"
                  aria-label={saved ? `Remove ${pick.venue.name} from saved` : `Save ${pick.venue.name}`}
                  aria-pressed={saved}
                  className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[9px] border border-white/20 transition-colors hover:border-white"
                  onClick={() => onToggleSave(pick.venue.id)}
                >
                  <Heart className={cn("h-4 w-4", saved && "fill-clay-accent text-clay-accent")} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        <button type="button" className={cn(OUTLINE_BUTTON, "h-[42px] px-5 text-[13.5px]")} onClick={onSwapWildcard}>
          Swap the wildcard
        </button>
        <button type="button" className={TEXT_LINK} onClick={onRestart}>
          Start again
        </button>
        <Link to={allMatchesHref} className="ml-auto text-[13px] text-white/50 transition-colors hover:text-white">
          {matchCount === 1 ? "Only one venue clears all four" : `Or see all ${matchCount} matches`}
        </Link>
      </div>
    </section>
  );
}
