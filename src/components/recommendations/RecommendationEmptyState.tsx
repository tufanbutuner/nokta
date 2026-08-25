import { EmptyState } from "@/components/state/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function RecommendationEmptyState({ onRestart }: { onRestart: () => void }) {
  return (
    <EmptyState title="No strong matches found" description="Try choosing fewer preferences or broadening your budget.">
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onRestart}>Start again</Button>
        <Button asChild variant="outline">
          <Link reloadDocument to="/discover">
            Discover all venues
          </Link>
        </Button>
      </div>
    </EmptyState>
  );
}
