import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MyBookingsEmptyState() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <h2 className="font-brand text-2xl font-bold tracking-[-0.5px]">You do not have any booking requests yet.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">When you request a booking from a venue, it will appear here.</p>
      <Button asChild className="mt-5">
        <Link to="/discover">Explore venues</Link>
      </Button>
    </div>
  );
}
