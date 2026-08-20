import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageContainer className="py-20">
        <LoadingState message="Checking your account..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="py-20">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">You need to sign in to view your account.</h1>
            <Button asChild className="mt-6">
              <Link reloadDocument to="/sign-in">
                Sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
