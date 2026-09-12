import { PRIMARY_BUTTON, RecommendEyebrow, TEXT_LINK } from "@/components/recommendations/flow/RecommendChrome";
import { cn } from "@/lib/utils";
import { MAX_VIBES } from "@/types/recommendFlow";
import type { RecommendQuestion } from "@/lib/recommendQuestions";

export function RecommendQuestionScreen({
  question,
  isSelected,
  matchCount,
  vibeCount,
  neighbourhood,
  hasPreciseLocation,
  onPick,
  onContinue,
  onBack,
  isFirstQuestion,
}: {
  question: RecommendQuestion;
  isSelected: (value: string | number) => boolean;
  matchCount: number;
  vibeCount: number;
  neighbourhood: string;
  hasPreciseLocation: boolean;
  onPick: (value: string | number) => void;
  onContinue: () => void;
  onBack: () => void;
  isFirstQuestion: boolean;
}) {
  const isDistance = question.key === "distance";
  const hint = isDistance ? question.hint.replace("{neighbourhood}", neighbourhood) : question.hint;
  const atVibeCap = Boolean(question.multi) && vibeCount >= MAX_VIBES;

  return (
    <section className="relative z-10 flex flex-1 flex-col justify-center gap-[clamp(18px,2.8cqi,30px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(14px,2cqi,22px)] pt-[clamp(8px,2cqi,24px)]">
      <div className="grid gap-3">
        <RecommendEyebrow>{question.eyebrow}</RecommendEyebrow>
        <h1 className="max-w-[760px] text-[clamp(27px,6.2cqi,50px)] font-semibold leading-[1.06] tracking-[-1.4px] [text-wrap:pretty]">{question.title}</h1>
        <p className="text-[clamp(13px,1.5cqi,15.5px)] leading-[1.5] text-white/[.58]">{hint}</p>
      </div>

      <div className="grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-[clamp(8px,1.2cqi,12px)]">
        {question.options.map((option) => {
          const selected = isSelected(option.value);
          // A fourth vibe is a no-op rather than a silent swap, so the cap is explained not enforced invisibly.
          const blocked = atVibeCap && !selected;

          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={selected}
              aria-disabled={blocked}
              className={cn(
                "flex min-h-[clamp(76px,9cqi,104px)] flex-col justify-end gap-[5px] rounded-[14px] border-[1.5px] p-[clamp(11px,1.5cqi,16px)] text-left transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                selected ? "border-clay-accent bg-[rgba(196,93,62,.20)]" : "border-white/[.13] bg-white/[.04]",
                blocked && "cursor-not-allowed opacity-45 hover:translate-y-0",
              )}
              onClick={() => {
                if (blocked) return;
                onPick(option.value);
              }}
            >
              <span className="text-[clamp(15px,1.9cqi,19px)] font-semibold leading-[1.15] tracking-[-0.3px]">{option.label}</span>
              {option.sub ? <span className="text-[clamp(11.5px,1.25cqi,13px)] leading-[1.35] text-white/55">{option.sub}</span> : null}
            </button>
          );
        })}
      </div>

      {isDistance && !hasPreciseLocation ? (
        <div className="flex max-w-[560px] items-start gap-3 rounded-xl border border-white/[.14] bg-white/[.04] p-[clamp(11px,1.3cqi,14px)]">
          <span aria-hidden="true" className="mt-px inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-[#e0805f] text-[11px] font-bold text-[#e0805f]">
            i
          </span>
          <p className="text-[13px] leading-[1.5] text-white/[.62]">
            Location is off, so distance is estimated from your last city. <span className="font-semibold text-white">Turn on location</span> for real walking times.
          </p>
        </div>
      ) : null}

      <div className="flex min-h-10 flex-wrap items-center gap-3.5">
        {question.multi ? (
          <button type="button" className={cn(PRIMARY_BUTTON, "h-11 rounded-[10px] px-6 text-[14.5px]")} onClick={onContinue}>
            {vibeCount ? `Continue with ${vibeCount}` : "No preference"}
          </button>
        ) : null}
        <button type="button" className={cn(TEXT_LINK, "h-11")} onClick={onBack}>
          {isFirstQuestion ? "Cancel" : "Back"}
        </button>

        {/* The key affordance: it warns before the user reaches a dead end. */}
        <p className="ml-auto flex items-center gap-1.5 text-[13px] text-white/60">
          <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", matchCount ? "bg-[#7ec488]" : "bg-[#e0b05f]")} />
          {matchCount ? `${matchCount} spots still match` : "Nothing matches yet"}
        </p>
      </div>
    </section>
  );
}
