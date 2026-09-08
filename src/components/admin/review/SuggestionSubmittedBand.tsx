import { ExternalLink } from "lucide-react";
import type { VenueSuggestion } from "@/types/venueSuggestions";

export function SuggestionSubmittedBand({ suggestion }: { suggestion: VenueSuggestion }) {
  const rows = [
    ["Venue name", suggestion.venueName],
    ["Category", formatValue(suggestion.primaryCategory)],
    ["Location", [suggestion.area, suggestion.city, suggestion.postcode].filter(Boolean).join(", ")],
    ["Address", suggestion.address],
    ["Phone", suggestion.phone],
    ["Secondary categories", suggestion.secondaryCategories.map(formatValue).join(", ")],
  ];

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-[oklch(0.97_0.012_60)] px-4 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
        Suggested venue
      </div>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-[13px] font-medium text-nokta-ink">{value || <span className="font-normal italic text-muted-foreground">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="grid border-t sm:grid-cols-2">
        <SourceLink label="Website" href={suggestion.website} />
        <SourceLink label="Instagram" href={suggestion.instagram} bordered />
      </div>
    </section>
  );
}

function SourceLink({ label, href, bordered }: { label: string; href: string | null; bordered?: boolean }) {
  return (
    <div className={`px-4 py-3 ${bordered ? "border-t sm:border-l sm:border-t-0" : ""}`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-[13px] font-medium text-clay-accent hover:underline">
          {href} <ExternalLink className="h-3.5 w-3.5 flex-none" />
        </a>
      ) : <p className="mt-1 text-[13px] italic text-muted-foreground">Not provided</p>}
    </div>
  );
}

function formatValue(value: string): string {
  return value.split("_").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}
