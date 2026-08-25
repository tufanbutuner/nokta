import type { MonetisationSummary } from "@/lib/monetisationSummary";

const CARD_CLASS = "rounded-xl border border-black/[0.04] bg-white px-4 py-[18px]";

export function MonetisationSummaryCards({ summary }: { summary: MonetisationSummary }) {
  const items = [
    { label: "Total Venues", value: summary.totalVenues, valueClassName: "text-clay-600" },
    {
      label: "Claimed",
      value: summary.claimedCount,
      valueClassName: "text-clay-600",
      subline: `${summary.claimedPercentage}% of venues`,
      sublineClassName: "text-forest-400",
    },
    {
      label: "In Pipeline",
      value: summary.pipelineCount,
      valueClassName: "text-clay-400",
      subline: "contacted -> paying",
      sublineClassName: "text-[#8a7e72]",
    },
    {
      label: "Paying",
      value: summary.payingCount,
      valueClassName: "text-forest-400",
      subline: `£${summary.payingMrr.toLocaleString("en-GB")} MRR`,
      sublineClassName: "text-[#8a7e72]",
    },
    {
      label: "Featured Eligible",
      value: summary.featuredEligibleCount,
      valueClassName: "text-clay-600",
      subline: `${summary.featuredEligiblePercentage}% of venues`,
      sublineClassName: "text-[#8a7e72]",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className={CARD_CLASS}>
          <p className="mb-2 font-['Outfit'] text-[11px] font-medium text-[#8a7e72]">{item.label}</p>
          <p className={`font-['Outfit'] text-[28px] font-semibold leading-none tracking-[-1px] ${item.valueClassName}`}>{item.value}</p>
          {item.subline ? <p className={`mt-1 text-[11px] ${item.sublineClassName}`}>{item.subline}</p> : null}
        </div>
      ))}
    </div>
  );
}
