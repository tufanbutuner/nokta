import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEGACY_STARTER_PLAN_OPTION, PLAN_OPTIONS } from "@/lib/planConfig";
import { getCityOptions } from "@/lib/cities";
import type { VenuePlan, VenueSubscriptionStatus } from "@/types/subscriptions";

export interface AdminSubscriptionFilterState {
  query: string;
  plan: VenuePlan | "all";
  status: VenueSubscriptionStatus | "all";
  city: string | "all";
}

export function AdminSubscriptionFilters({ value, onChange }: { value: AdminSubscriptionFilterState; onChange: (value: AdminSubscriptionFilterState) => void }) {
  return (
    <section className="rounded-xl border border-black/[0.04] bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_190px]">
        <Input value={value.query} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="Search venue name" />
        <Select value={value.plan} onValueChange={(plan) => onChange({ ...value, plan: plan as AdminSubscriptionFilterState["plan"] })} options={[{ label: "All plans", value: "all" }, ...PLAN_OPTIONS, LEGACY_STARTER_PLAN_OPTION]} />
        <Select
          value={value.status}
          onValueChange={(status) => onChange({ ...value, status: status as AdminSubscriptionFilterState["status"] })}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Inactive", value: "inactive" },
            { label: "Trial", value: "trial" },
            { label: "Active", value: "active" },
            { label: "Past due", value: "past_due" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
        <Select
          id="subscription-city-filter"
          value={value.city}
          onValueChange={(city) => onChange({ ...value, city })}
          options={[{ label: "All cities", value: "all" }, ...getCityOptions()]}
        />
      </div>
    </section>
  );
}
