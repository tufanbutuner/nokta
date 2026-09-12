import { OUTLINE_BUTTON, PRIMARY_BUTTON, RecommendEyebrow } from "@/components/recommendations/flow/RecommendChrome";
import { ROLE_COLORS, roleLabel, formatPickMeta } from "@/components/recommendations/flow/recommendPickMeta";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { RecommendPick } from "@/types/recommendFlow";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export function RecommendSavedScreen({
  picks,
  shortlistName,
  summary,
  otherShortlistNames,
  onRename,
  onShare,
  onRestart,
}: {
  picks: RecommendPick[];
  shortlistName: string;
  summary: string;
  otherShortlistNames: string[];
  onRename: () => void;
  onShare: () => void;
  onRestart: () => void;
}) {
  return (
    <section className="relative z-10 flex flex-1 flex-col gap-[clamp(14px,2cqi,20px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(8px,2cqi,20px)] motion-safe:animate-[rdFade_.3s_both]">
      <div className="flex items-center gap-3 rounded-xl border border-[rgba(126,196,136,.4)] bg-[rgba(126,196,136,.12)] p-[clamp(11px,1.4cqi,15px)]">
        <span aria-hidden="true" className="inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#7ec488]">
          <Check className="h-3.5 w-3.5 text-[#141312]" strokeWidth={3} />
        </span>
        <p className="text-[13.5px] text-white/[.82]">Saved to your account. It will still be here next week.</p>
      </div>

      <div className="grid gap-2.5">
        <RecommendEyebrow>Saved shortlist</RecommendEyebrow>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[clamp(22px,4.2cqi,34px)] font-semibold leading-tight tracking-[-1px]">{shortlistName}</h1>
          <button type="button" className="text-[13px] font-semibold text-[#e0805f] transition-colors hover:text-white" onClick={onRename}>
            Rename
          </button>
        </div>
        <p className="text-[13.5px] text-white/[.58]">{summary}</p>
      </div>

      <div className="grid gap-2.5">
        {picks.map((pick) => (
          <div key={pick.venue.id} className="flex flex-wrap items-center gap-[13px] rounded-[13px] border border-white/[.13] bg-white/[.04] p-[clamp(10px,1.2cqi,13px)]">
            <img src={getVenueImage(pick.venue)} alt={`${pick.venue.name} interior`} className="h-[clamp(52px,6cqi,66px)] w-[clamp(52px,6cqi,66px)] flex-none rounded-[9px] object-cover" />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: ROLE_COLORS[pick.role] }}>
                  {roleLabel(pick.role, pick.miles)}
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-white/55">{pick.match}</span>
              </div>
              <h2 className="truncate text-[clamp(15px,1.8cqi,18px)] font-semibold leading-tight">{pick.venue.name}</h2>
              <p className="text-[12.5px] text-white/60">{formatPickMeta(pick.venue, pick.miles)}</p>
            </div>
            <Link to={`/venues/${pick.venue.slug}/request-booking`} className={cn(OUTLINE_BUTTON, "h-[38px] rounded-[9px] px-[15px] text-[13px]")}>
              Request a table
            </Link>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={cn(PRIMARY_BUTTON, "h-11 rounded-[10px] px-5 text-[14px]")} onClick={onShare}>
          Share this shortlist
        </button>
        <button type="button" className={cn(OUTLINE_BUTTON, "h-11 rounded-[10px] px-5 text-[14px]")} onClick={onRestart}>
          Ask again for another night
        </button>
      </div>

      {otherShortlistNames.length ? <p className="text-[12.5px] text-white/45">Your other shortlists: {otherShortlistNames.join(" · ")}</p> : null}
    </section>
  );
}
