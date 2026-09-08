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
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-[oklch(0.97_0.012_60)] px-4 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
        Claim evidence
      </div>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={label} className={`px-4 py-3 ${index < rows.length - 2 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-[13px] font-medium text-nokta-ink">{value || <span className="font-normal italic text-muted-foreground">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">Proof</div>
        {claim.proofUrl ? (
          <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-clay-accent hover:underline">
            Open submitted evidence <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="mt-1 text-[13px] italic text-muted-foreground">No evidence link provided.</p>
        )}
      </div>
    </section>
  );
}

function formatRole(role: VenueClaimRequest["claimantRole"]): string {
  if (role === "marketing") return "Marketing / agency";
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}
