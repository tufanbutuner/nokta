import { Select } from "@/components/ui/select";

export type MyBookingsFilterValue = "all" | "action_needed" | "upcoming" | "pending" | "past";

const OPTIONS: { label: string; value: MyBookingsFilterValue }[] = [
  { label: "All bookings", value: "all" },
  { label: "Action needed", value: "action_needed" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Pending", value: "pending" },
  { label: "Past / Closed", value: "past" },
];

export function MyBookingsFilters({ value, onChange }: { value: MyBookingsFilterValue; onChange: (value: MyBookingsFilterValue) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-muted-foreground">Filter bookings</p>
      <Select value={value} onValueChange={(next) => onChange(next as MyBookingsFilterValue)} options={OPTIONS} />
    </div>
  );
}
