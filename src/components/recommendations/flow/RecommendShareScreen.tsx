import { PRIMARY_BUTTON, RecommendEyebrow, TEXT_LINK } from "@/components/recommendations/flow/RecommendChrome";
import { ROLE_COLORS, roleLabel, formatPickShortMeta } from "@/components/recommendations/flow/recommendPickMeta";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { RecommendPick } from "@/types/recommendFlow";

export function RecommendShareScreen({
  picks,
  shortlistName,
  summary,
  city,
  shareUrl,
  copyLabel,
  isPreparing,
  onCopy,
  onSendTo,
  onBack,
}: {
  picks: RecommendPick[];
  shortlistName: string;
  summary: string;
  city: string;
  shareUrl: string;
  copyLabel: string;
  isPreparing: boolean;
  onCopy: () => void;
  onSendTo: (channel: "whatsapp" | "instagram") => void;
  onBack: () => void;
}) {
  return (
    <section className="relative z-10 flex flex-1 flex-col gap-[clamp(14px,2cqi,20px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(8px,2cqi,20px)] motion-safe:animate-[rdFade_.3s_both]">
      <div className="grid gap-3">
        <RecommendEyebrow>Share</RecommendEyebrow>
        <h1 className="text-[clamp(24px,4.6cqi,38px)] font-semibold leading-[1.08] tracking-[-1.1px]">Send the three, not the search.</h1>
        <p className="max-w-[560px] text-[clamp(13px,1.5cqi,15.5px)] leading-[1.5] text-white/[.58]">
          Anyone opening the link sees the same three picks and can vote on one. Your location is never included.
        </p>
      </div>

      {/* This card is also the source of the OG image for the shared URL. */}
      <div className="max-w-[620px] overflow-hidden rounded-2xl border border-white/[.16] bg-[#1c1a19] p-[clamp(14px,1.8cqi,20px)]">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[13px] font-semibold">nokta</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-white/45">Shortlist · {city}</span>
        </div>
        <h2 className="mt-2 text-[clamp(17px,2.3cqi,23px)] font-semibold leading-tight">{shortlistName}</h2>

        <div className="mt-3.5 grid grid-cols-1 gap-2 min-[520px]:grid-cols-3">
          {picks.map((pick) => (
            <div key={pick.venue.id} className="grid gap-1.5">
              <img src={getVenueImage(pick.venue)} alt={`${pick.venue.name} interior`} className="w-full rounded-lg object-cover [aspect-ratio:4/3]" />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.13em]" style={{ color: ROLE_COLORS[pick.role] }}>
                {roleLabel(pick.role, pick.miles)}
              </span>
              <span className="truncate text-[13px] font-semibold leading-tight">{pick.venue.name}</span>
              <span className="truncate text-[11.5px] text-white/50">{formatPickShortMeta(pick.venue)}</span>
            </div>
          ))}
        </div>

        <p className="mt-3.5 text-[12px] text-white/45">{summary}</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <input
          readOnly
          value={isPreparing ? "Preparing your link…" : shareUrl}
          aria-label="Shareable link"
          className="h-[46px] min-w-[220px] flex-1 rounded-[10px] border border-white/[.18] bg-transparent px-3.5 font-mono text-[13.5px] font-medium text-white/80 outline-none focus:border-white/40"
          onFocus={(event) => event.currentTarget.select()}
        />
        <button type="button" className={cn(PRIMARY_BUTTON, "h-[46px] rounded-[10px] px-5 text-[14px]")} disabled={isPreparing} onClick={onCopy}>
          {copyLabel}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[13px] text-white/50">Or send straight to</span>
        <button type="button" className="rounded-[9px] border border-white/[.18] px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-white" onClick={() => onSendTo("whatsapp")}>
          WhatsApp
        </button>
        <button type="button" className="rounded-[9px] border border-white/[.18] px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-white" onClick={() => onSendTo("instagram")}>
          Instagram
        </button>
        <button type="button" className={cn(TEXT_LINK, "ml-auto")} onClick={onBack}>
          Back to the three
        </button>
      </div>
    </section>
  );
}
