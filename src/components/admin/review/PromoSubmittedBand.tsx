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
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="border-b bg-[oklch(0.97_0.012_60)] px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">Promotion copy</div>
        <h3 className="mt-1 text-[15px] font-semibold text-nokta-ink">{request.title}</h3>
        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.55] text-muted-foreground">{request.description || "No description provided."}</p>
      </header>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-[13px] font-medium text-nokta-ink">{value || <span className="font-normal italic text-muted-foreground">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">Call to action</div>
        <p className="mt-1 text-[13px] font-medium text-nokta-ink">{request.ctaLabel || "Not provided"}</p>
        {request.ctaUrl ? <a href={request.ctaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-[12.5px] text-clay-accent hover:underline">{request.ctaUrl} <ExternalLink className="h-3.5 w-3.5 flex-none" /></a> : null}
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
