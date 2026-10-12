import type { PropsWithChildren } from "react";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/state/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function RequireAdmin({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { isAdmin, isLoading, error } = useIsAdmin();

  if (isLoading) {
    return (
      <PageContainer className="py-20">
        <LoadingState message="Checking admin access..." />
      </PageContainer>
    );
  }

  if (!user) {
    return <SignInPrompt title="Sign in to view admin tools" />;
  }

  if (!isAdmin) {
    return (
      <PageContainer className="py-20">
        <Card className="mx-auto max-w-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">Not authorised</h1>
            <p className="mt-3 text-muted-foreground">
              Your account is signed in, but it is not configured as a nokta admin.
            </p>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
