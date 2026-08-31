import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function SignUpPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password should be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nextEmail = email.trim();
      await signUp(nextEmail, password);
      setSubmittedEmail(nextEmail);
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <PageMeta title="Create account | Sheesha" description="Create a Sheesha account to save venues, write reviews and suggest missing shisha lounges." canonicalPath="/sign-up" />
      <PageContainer className="py-12">
        {submittedEmail ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="space-y-5 p-6 text-center">
              <div>
                <p className="text-sm text-clay-accent">Check your email</p>
                <h1 className="mt-2 font-brand text-3xl font-bold tracking-[-0.5px]">Confirm your Sheesha account</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  We sent a confirmation email to {submittedEmail}. Open the link in that email to activate your account, then sign in.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link to="/sign-in">Go to sign in</Link>
                </Button>
                <Button variant="outline" onClick={() => setSubmittedEmail(null)}>
                  Use a different email
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AuthForm
            mode="sign-up"
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            error={error}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleSubmit}
          />
        )}
      </PageContainer>
    </main>
  );
}
