import { EmptyState } from "@/components/state/EmptyState";

export function SavedEmptyState({ showSignInCta = false }: { showSignInCta?: boolean }) {
  return (
    <EmptyState
      title="No saved venues yet"
      description={`Tap the heart on any venue to save it here.${showSignInCta ? " Sign in to sync your saved venues across devices." : ""}`}
      actionLabel="Discover venues"
      actionHref="/discover"
      secondaryActionLabel={showSignInCta ? "Sign in" : undefined}
      secondaryActionHref={showSignInCta ? "/sign-in" : undefined}
    />
  );
}
