import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MyBookingsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-nokta-border px-6 py-12 text-center">
      <h2 className="font-brand text-2xl font-bold tracking-[-0.01em] text-nokta-ink">No booking requests yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-nokta-ink-muted">Request a table from any venue page and you can follow the venue's reply here.</p>
      <Button asChild className="mt-6 h-11 rounded-full px-6">
        <Link to="/">Find a venue</Link>
      </Button>
    </div>
  );
}
