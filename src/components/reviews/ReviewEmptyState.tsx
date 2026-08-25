import { EmptyState } from "@/components/state/EmptyState";

export function ReviewEmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <EmptyState
      title="No reviews yet"
      description={signedIn ? "Be the first to share your experience." : "Sign in to leave the first review."}
      className="p-6"
    />
  );
}
