import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SavedEmptyState() {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-3xl font-semibold">No saved venues yet</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">Tap the heart on any venue to save it here.</p>
      <Button asChild className="mt-6">
        <Link reloadDocument to="/discover">
          Discover venues
        </Link>
      </Button>
    </div>
  );
}
