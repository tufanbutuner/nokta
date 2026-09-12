import { PRIMARY_BUTTON, RecommendEyebrow, TEXT_LINK } from "@/components/recommendations/flow/RecommendChrome";
import { formatPickMeta } from "@/components/recommendations/flow/recommendPickMeta";
import { cn } from "@/lib/utils";
import type { RelaxOption } from "@/types/recommendFlow";
import type { Venue } from "@/types/venue";
import { Link } from "react-router-dom";

/** Never dead-end: name the conflict, offer the cheapest way out, show a fallback. */
export function RecommendNoMatchScreen({
  headline,
  relaxOptions,
  fallback,
  fallbackMiles,
  onRelax,
  onRestart,
}: {
  headline: string;
  relaxOptions: RelaxOption[];
  fallback: Venue | null;
  fallbackMiles: number | null;
  onRelax: (option: RelaxOption) => void;
  onRestart: () => void;
}) {
  return (
    <section className="relative z-10 flex flex-1 flex-col justify-center gap-[clamp(16px,2.2cqi,24px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(8px,2cqi,24px)] motion-safe:animate-[rdFade_.3s_both]">
      <div className="grid gap-3">
        <RecommendEyebrow tone="warning">Nothing clears all four</RecommendEyebrow>
        <h1 className="max-w-[820px] text-[clamp(26px,5.6cqi,44px)] font-semibold leading-[1.08] tracking-[-1.4px] [text-wrap:pretty]">{headline}</h1>
        <p className="max-w-[620px] text-[clamp(13px,1.5cqi,15.5px)] leading-[1.5] text-white/[.58]">Drop one of these and we have options straight away. We will keep everything else as you set it.</p>
      </div>

      {relaxOptions.length ? (
        <div className="flex flex-wrap gap-2.5">
          {relaxOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className="inline-flex min-h-[46px] items-center gap-2.5 rounded-[11px] border-[1.5px] border-white/20 bg-white/[.05] px-[18px] text-[14px] font-medium transition-colors hover:border-clay-accent hover:bg-[rgba(196,93,62,.15)]"
              onClick={() => onRelax(option)}
            >
              {option.label}
              <span className="text-[12.5px] text-white/50">{option.gain === 1 ? "1 spot opens up" : `${option.gain} spots open up`}</span>
            </button>
          ))}
        </div>
      ) : null}

      {fallback ? (
        <div className="flex max-w-[640px] flex-wrap items-center justify-between gap-4 rounded-[14px] border border-white/[.14] bg-white/[.04] p-[clamp(13px,1.6cqi,18px)]">
          <div className="grid gap-1.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-white/50">Closest thing regardless</p>
            <h2 className="text-[clamp(16px,2cqi,20px)] font-semibold leading-tight">{fallback.name}</h2>
            <p className="text-[13px] text-white/60">{formatPickMeta(fallback, fallbackMiles)}</p>
          </div>
          <Link to={`/venues/${fallback.slug}`} className={cn(PRIMARY_BUTTON, "h-[42px] rounded-[10px] px-5 text-[13.5px]")}>
            View venue
          </Link>
        </div>
      ) : null}

      <button type="button" className={cn(TEXT_LINK, "justify-self-start text-left")} onClick={onRestart}>
        Start the four questions again
      </button>
    </section>
  );
}
