import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function RecommendationEmptyState({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h2 className="text-3xl font-semibold">No strong matches found</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">Try choosing fewer preferences or broadening your budget.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onRestart}>Start again</Button>
        <Button asChild variant="outline">
          <Link reloadDocument to="/discover">
            Discover all venues
          </Link>
        </Button>
      </div>
    </div>
  );
}
