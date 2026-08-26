import { EmptyState } from "@/components/state/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function RecommendationEmptyState({ city, onRestart }: { city: string; onRestart: () => void }) {
  return (
    <EmptyState title="No strong matches found" description="We found fewer matches in this city. Try removing a few filters or exploring all venues nearby.">
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onRestart}>Start again</Button>
        <Button asChild variant="outline">
          <Link to={`/discover?city=${encodeURIComponent(city)}`}>
            Explore {city}
          </Link>
        </Button>
      </div>
    </EmptyState>
  );
}
