import { Card } from "@/components/ui/card";

export function ReviewEmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold">No reviews yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {signedIn ? "Be the first to share your experience." : "Sign in to leave the first review."}
      </p>
    </Card>
  );
}
