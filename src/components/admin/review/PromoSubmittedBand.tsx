import { ExternalLink } from "lucide-react";
import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";

export function PromoSubmittedBand({ request }: { request: OwnerPromotionRequest }) {
  const rows = [
    ["Request type", request.requestType === "promoted_offer" ? "Promoted offer" : "Featured placement"],
    ["Placement / offer", formatValue(request.offerType ?? request.placementType)],
    ["Location", [request.requestedArea, request.requestedCity].filter(Boolean).join(", ")],
    ["Requested dates", formatRange(request.requestedStartsAt, request.requestedEndsAt)],
    ["Priority", String(request.requestedPriority)],
    ["Terms", request.terms],
  ];

  return (
    <section className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border">
      <header className="border-b bg-nokta-hover px-4 py-3 border-nokta-border">
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">Promotion copy</div>
        <h3 className="mt-1 text-[15px] font-semibold text-nokta-ink">{request.title}</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.55] text-nokta-ink-muted">{request.description || "No description provided."}</p>
      </header>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-nokta-ink">{value || <span className="font-normal italic text-nokta-ink-muted">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t px-4 py-3 border-nokta-border">
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">Call to action</div>
        <p className="mt-1 text-sm font-medium text-nokta-ink">{request.ctaLabel || "Not provided"}</p>
        {request.ctaUrl ? <a href={request.ctaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-[13px] text-nokta-accent-dark hover:underline">{request.ctaUrl} <ExternalLink className="h-3.5 w-3.5 flex-none" /></a> : null}
      </div>
    </section>
  );
}

function formatValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(/[_-]/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
