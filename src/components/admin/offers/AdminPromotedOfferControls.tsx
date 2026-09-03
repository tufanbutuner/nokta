import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROMOTED_OFFER_STATUS_OPTIONS, PROMOTED_OFFER_TYPE_OPTIONS } from "@/lib/promotedOfferLabels";
import type { PromotedOffer, PromotedOfferStatus, PromotedOfferType } from "@/types/promotedOffers";

export type PromotedOfferStatusFilter = "all" | PromotedOfferStatus;
export type PromotedOfferTypeFilter = "all" | PromotedOfferType;

export function PromotedOfferSummaryCards({ offers }: { offers: PromotedOffer[] }) {
  const active = offers.filter((offer) => offer.status === "active").length;
  const draft = offers.filter((offer) => offer.status === "draft").length;
  const paused = offers.filter((offer) => offer.status === "paused").length;
  const birthday = offers.filter((offer) => offer.offerType === "birthday").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total offers" value={offers.length} />
      <MetricCard label="Active" value={active} />
      <MetricCard label="Draft" value={draft} />
      <MetricCard label="Paused/Birthday" value={paused + birthday} />
    </div>
  );
}

export function PromotedOfferFilters({
  query,
  statusFilter,
  typeFilter,
  cityFilter,
  cityOptions,
  onQueryChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onCityFilterChange,
}: {
  query: string;
  statusFilter: PromotedOfferStatusFilter;
  typeFilter: PromotedOfferTypeFilter;
  cityFilter: string;
  cityOptions: string[];
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: PromotedOfferStatusFilter) => void;
  onTypeFilterChange: (type: PromotedOfferTypeFilter) => void;
  onCityFilterChange: (city: string) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
      <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search offer, venue, city or area" />
      <Select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as PromotedOfferStatusFilter)} options={[{ label: "All statuses", value: "all" }, ...PROMOTED_OFFER_STATUS_OPTIONS]} />
      <Select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as PromotedOfferTypeFilter)} options={[{ label: "All types", value: "all" }, ...PROMOTED_OFFER_TYPE_OPTIONS]} />
      <Select value={cityFilter} onChange={(event) => onCityFilterChange(event.target.value)} options={[{ label: "All cities", value: "all" }, ...cityOptions.map((city) => ({ label: city, value: city }))]} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
