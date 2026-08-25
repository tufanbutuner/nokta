import type { MonetisationSummary } from "@/lib/monetisationSummary";

export function MonetisationPipelineFunnel({ summary }: { summary: MonetisationSummary }) {
  const stages = [
    { label: "Not Contacted", count: summary.notContactedCount, className: "bg-clay-100 text-[#8a7e72]" },
    { label: "Contacted", count: summary.contactedCount, className: "bg-clay-300/25 text-[#8a7e72]" },
    { label: "Interested", count: summary.interestedCount, className: "bg-clay-300/55 text-[#5a4535]" },
    { label: "Trial", count: summary.trialCount, className: "bg-clay-400/40 text-[#7a3525]" },
    { label: "Paying", count: summary.payingCount, className: "bg-forest-400 text-white" },
  ];
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <section className="rounded-xl border border-black/[0.04] bg-white p-5">
      <h2 className="font-['Outfit'] text-xs font-semibold text-clay-600">Pipeline Funnel</h2>
      <div className="mt-4 flex h-9 overflow-hidden rounded-lg bg-clay-100">
        {stages.map((stage) => {
          const flexValue = total ? stage.count : 1;

          return (
            <div
              key={stage.label}
              className={`mx-0.5 first:ml-0 last:mr-0 flex min-w-[34px] items-center justify-center px-2 text-center font-['Outfit'] text-[11px] font-semibold ${stage.className}`}
              style={{ flex: flexValue }}
              title={`${stage.label}: ${stage.count}`}
            >
              <span className="truncate">
                {stage.count}
                {stage.count > 1 ? <span className="hidden xl:inline"> {stage.label}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {stages.map((stage) => (
          <div key={stage.label} className="truncate text-[9px] font-medium text-[#8a7e72]">
            {stage.label}
          </div>
        ))}
      </div>
    </section>
  );
}
