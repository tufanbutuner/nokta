import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
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
    return (
      <PageContainer className="py-20">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">Sign in to view admin tools.</h1>
            <Button asChild className="mt-6">
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer className="py-20">
        <Card className="mx-auto max-w-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">Not authorised</h1>
            <p className="mt-3 text-muted-foreground">
              Your account is signed in, but it is not configured as a Sheesha admin.
            </p>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
