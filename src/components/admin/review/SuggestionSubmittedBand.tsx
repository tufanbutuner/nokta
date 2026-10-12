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
    <section className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border">
      <div className="border-b bg-nokta-hover px-4 py-[9px] text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted border-nokta-border">
        Suggested venue
      </div>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-nokta-ink">{value || <span className="font-normal italic text-nokta-ink-muted">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="grid border-t sm:grid-cols-2 border-nokta-border">
        <SourceLink label="Website" href={suggestion.website} />
        <SourceLink label="Instagram" href={suggestion.instagram} bordered />
      </div>
    </section>
  );
}

function SourceLink({ label, href, bordered }: { label: string; href: string | null; bordered?: boolean }) {
  return (
    <div className={`px-4 py-3 ${bordered ? "border-t sm:border-l sm:border-t-0" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-nokta-accent-dark hover:underline">
          {href} <ExternalLink className="h-3.5 w-3.5 flex-none" />
        </a>
      ) : <p className="mt-1 text-sm italic text-nokta-ink-muted">Not provided</p>}
    </div>
  );
}

function formatValue(value: string): string {
  return value.split("_").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}
