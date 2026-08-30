import type { OwnerPromotionRequest } from "@/types/ownerPromotionRequests";

export function OwnerPromotionSummaryCards({ activeOffers, activeFeatured, requests }: { activeOffers: number; activeFeatured: number; requests: OwnerPromotionRequest[] }) {
  const pending = requests.filter((request) => request.status === "pending").length;
  const rejected = requests.filter((request) => request.status === "rejected").length;
  const converted = requests.filter((request) => request.status === "converted").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Active offers" value={activeOffers} />
      <Metric label="Active featured" value={activeFeatured} />
      <Metric label="Pending requests" value={pending} />
      <Metric label="Rejected requests" value={rejected} />
      <Metric label="Live requests" value={converted} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}
