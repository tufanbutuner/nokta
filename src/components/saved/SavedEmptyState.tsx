import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SavedEmptyState({ showSignInCta = false }: { showSignInCta?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-3xl font-semibold">No saved venues yet</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Tap the heart on any venue to save it here.
        {showSignInCta ? " Sign in to sync your saved venues across devices." : null}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link reloadDocument to="/discover">
            Discover venues
          </Link>
        </Button>
        {showSignInCta ? (
          <Button asChild variant="outline">
            <Link reloadDocument to="/sign-in">
              Sign in
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
