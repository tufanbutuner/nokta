const ITEMS = [
  ["Pending", "bg-amber-500 border-amber-500"],
  ["Accepted", "bg-emerald-600 border-emerald-600"],
  ["Alternative proposed", "bg-sky-500 border-sky-500"],
  ["Completed", "bg-stone-500 border-stone-500"],
  ["No-show / cancelled", "bg-rose-500 border-rose-500"],
];

export function OwnerBookingCalendarLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {ITEMS.map(([label, className]) => <span key={label} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full border ${className}`} />{label}</span>)}
    </div>
  );
}
