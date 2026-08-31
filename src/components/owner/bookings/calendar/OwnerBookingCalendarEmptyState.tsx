export function OwnerBookingCalendarEmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">{message}</div>;
}
