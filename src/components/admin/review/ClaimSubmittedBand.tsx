import { ExternalLink } from "lucide-react";
import type { VenueClaimRequest } from "@/types/venueClaims";

export function ClaimSubmittedBand({ claim }: { claim: VenueClaimRequest }) {
  const rows = [
    ["Claimant", claim.claimantName],
    ["Role", formatRole(claim.claimantRole)],
    ["Personal email", claim.claimantEmail],
    ["Personal phone", claim.claimantPhone],
    ["Business email", claim.businessEmail],
    ["Business phone", claim.businessPhone],
  ];

  return (
    <section className="overflow-hidden rounded-xl border bg-nokta-surface border-nokta-border">
      <div className="border-b bg-nokta-hover px-4 py-[9px] text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted border-nokta-border">
        Claim evidence
      </div>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-nokta-ink">{value || <span className="font-normal italic text-nokta-ink-muted">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t px-4 py-3 border-nokta-border">
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-nokta-ink-muted">Proof</div>
        {claim.proofUrl ? (
          <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-nokta-accent-dark hover:underline">
            Open submitted evidence <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="mt-1 text-sm italic text-nokta-ink-muted">No evidence link provided.</p>
        )}
      </div>
    </section>
  );
}

function formatRole(role: VenueClaimRequest["claimantRole"]): string {
  if (role === "marketing") return "Marketing / agency";
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}
