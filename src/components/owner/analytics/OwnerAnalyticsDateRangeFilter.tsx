import { Select } from "@/components/ui/select";
import type { OwnerAnalyticsDateRange } from "@/services/ownerVenueAnalyticsService";

export const OWNER_ANALYTICS_DATE_RANGE_OPTIONS: { label: string; value: OwnerAnalyticsDateRange }[] = [
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "This month", value: "this_month" },
  { label: "Last month", value: "last_month" },
  { label: "All time", value: "all_time" },
];

export function OwnerAnalyticsDateRangeFilter({
  value,
  onChange,
}: {
  value: OwnerAnalyticsDateRange;
  onChange: (value: OwnerAnalyticsDateRange) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium sm:w-52">
      Date range
      <Select value={value} onChange={(event) => onChange(event.target.value as OwnerAnalyticsDateRange)} options={OWNER_ANALYTICS_DATE_RANGE_OPTIONS} />
    </label>
  );
}
