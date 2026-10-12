import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField, authLinkClass, authSubmitClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckEmailPanel } from "@/components/auth/CheckEmailPanel";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/context/AuthContext";
import { describeAuthError } from "@/lib/authErrors";
import { getSafeRedirect, withRedirect } from "@/lib/authRedirect";

const MIN_PASSWORD_LENGTH = 8;

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading, signUp, resendConfirmation } = useAuth();
  const redirectParam = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const nextFieldErrors = {
      email: !trimmedEmail ? "Enter your email address." : !trimmedEmail.includes("@") ? "That doesn't look like an email address." : undefined,
      password: !password
        ? "Choose a password."
        : password.length < MIN_PASSWORD_LENGTH
          ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
          : undefined,
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) return;

    setIsSubmitting(true);
    try {
      await signUp(trimmedEmail, password, redirectParam ? getSafeRedirect(redirectParam) : undefined);
      setSubmittedEmail(trimmedEmail);
      setPassword("");
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoading && user) {
    return <Navigate replace to={getSafeRedirect(redirectParam)} />;
  }

  return (
    <main>
      <PageMeta title="Create account | nokta" description="Create a nokta account to save venues, follow booking requests and share shortlists with your group." canonicalPath="/sign-up" />
      {submittedEmail ? (
        <AuthShell
          title="Check your email"
          showPerks={false}
          footer={
            <p>
              Confirmed already?{" "}
              <Link to={withRedirect("/sign-in", redirectParam)} className={authLinkClass}>
                Sign in
              </Link>
            </p>
          }
        >
          <CheckEmailPanel email={submittedEmail} onResend={() => resendConfirmation(submittedEmail)} onChangeEmail={() => setSubmittedEmail(null)}>
            Open the link in that email to confirm your account. It brings you back here, ready to sign in.
          </CheckEmailPanel>
        </AuthShell>
      ) : (
        <AuthShell
          title="Create your account"
          description="Free, and it takes a minute. Keep your shortlist on every device and follow booking requests as venues reply."
          footer={
            <p>
              Already have an account?{" "}
              <Link to={withRedirect("/sign-in", redirectParam)} className={authLinkClass}>
                Sign in
              </Link>
            </p>
          }
        >
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              error={fieldErrors.email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <AuthField
              label="Password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              error={fieldErrors.password}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              onChange={(event) => setPassword(event.target.value)}
            />

            <AuthError message={error} />

            <button type="submit" className={authSubmitClass} disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-sm leading-relaxed text-nokta-ink-muted">
              By creating an account you agree to the{" "}
              <Link to="/terms" className="underline underline-offset-4 hover:text-nokta-ink">Terms</Link> and{" "}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-nokta-ink">Privacy policy</Link>.
            </p>
          </form>
        </AuthShell>
      )}
    </main>
  );
}
