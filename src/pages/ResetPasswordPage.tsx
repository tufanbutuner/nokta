import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField, authLinkClass, authSubmitClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { LoadingState } from "@/components/state/LoadingState";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/context/AuthContext";
import { describeAuthError } from "@/lib/authErrors";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Where the reset email lands. Supabase turns the link into a session before
 * this renders, so a signed-in user here is either recovering or changing their
 * password from the account page; both get the same form.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, isLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nextFieldError = !password
      ? "Choose a new password."
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : undefined;
    setFieldError(nextFieldError);
    if (nextFieldError) return;

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/account?passwordUpdated=1", { replace: true });
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <PageMeta title="Choose a new password | nokta" description="Set a new password for your nokta account." canonicalPath="/reset-password" />
      {isLoading ? (
        <PageContainer className="py-14">
          <div className="mx-auto max-w-md">
            <LoadingState message="Checking your reset link..." />
          </div>
        </PageContainer>
      ) : user ? (
        <AuthShell
          title="Choose a new password"
          description={
            <>
              For <span className="break-all font-semibold text-nokta-ink">{user.email}</span>.
            </>
          }
          showPerks={false}
        >
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <AuthField
              label="New password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              error={fieldError}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              onChange={(event) => setPassword(event.target.value)}
            />
            <AuthError message={error} />
            <button type="submit" className={authSubmitClass} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        </AuthShell>
      ) : (
        <AuthShell
          title="That link has expired"
          description="Reset links work once and only for a short while. Ask for a fresh one and use the newest email."
          showPerks={false}
          footer={
            <p>
              <Link to="/sign-in" className={authLinkClass}>
                Back to sign in
              </Link>
            </p>
          }
        >
          <Link to="/forgot-password" className={authSubmitClass}>
            Send a new link
          </Link>
        </AuthShell>
      )}
    </main>
  );
}
