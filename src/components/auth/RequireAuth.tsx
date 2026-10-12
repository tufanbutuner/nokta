import type { PropsWithChildren } from "react";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/state/LoadingState";
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
    return <SignInPrompt />;
  }

  return <>{children}</>;
}
