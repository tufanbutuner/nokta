import { OUTLINE_BUTTON, PRIMARY_BUTTON, RecommendEyebrow } from "@/components/recommendations/flow/RecommendChrome";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function RecommendEntryScreen({ lastAnswerChips, onStart, onRepeat }: { lastAnswerChips: string[]; onStart: () => void; onRepeat: () => void }) {
  return (
    <section className="relative z-10 flex flex-1 flex-col justify-center gap-[clamp(18px,2.6cqi,28px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(10px,2cqi,24px)]">
      <div className="grid gap-3.5">
        <RecommendEyebrow>Recommend</RecommendEyebrow>
        <h1 className="max-w-[720px] text-[clamp(30px,7cqi,58px)] font-semibold leading-[1.02] tracking-[-1.8px] [text-wrap:pretty]">Four questions. One good answer.</h1>
        <p className="max-w-[560px] text-[clamp(14px,1.65cqi,17px)] leading-[1.5] text-white/[.62]">
          No filters, no scrolling through forty lounges. Tell us who you are with and what you are spending, and we will name three places worth your night.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={cn(PRIMARY_BUTTON, "h-[52px] px-7 text-[15.5px]")} onClick={onStart}>
          Start — takes 20 seconds
        </button>
        <Link to="/discover" className={cn(OUTLINE_BUTTON, "h-[52px] px-[22px] text-[14.5px]")}>
          Browse all venues instead
        </Link>
      </div>

      {/* Hidden entirely for first-time users — there is nothing to run again. */}
      {lastAnswerChips.length ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-[clamp(14px,1.8cqi,20px)]">
          <p className="text-[13px] text-white/50">Last time you asked for</p>
          <div className="flex flex-wrap gap-2">
            {lastAnswerChips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/[.16] bg-white/[.05] px-[11px] py-1.5 text-[12.5px] text-white/80">
                {chip}
              </span>
            ))}
          </div>
          <button type="button" className="text-[13px] font-semibold text-[#e0805f] transition-colors hover:text-white" onClick={onRepeat}>
            Run it again
          </button>
        </div>
      ) : null}
    </section>
  );
}
