import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField, authLinkClass, authSubmitClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/context/AuthContext";
import { describeAuthError } from "@/lib/authErrors";
import { getSafeRedirect, withRedirect } from "@/lib/authRedirect";

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, signIn, resendConfirmation } = useAuth();
  const redirectParam = searchParams.get("redirect");
  const redirectTo = getSafeRedirect(redirectParam);
  const justConfirmed = searchParams.get("confirmed") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resent, setResent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsConfirmation(false);

    const nextFieldErrors = {
      email: email.trim() ? undefined : "Enter your email address.",
      password: password ? undefined : "Enter your password.",
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) return;

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
      setNeedsConfirmation(caughtError instanceof Error && caughtError.message.toLowerCase().includes("email not confirmed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      await resendConfirmation(email.trim());
      setResent(true);
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
    }
  }

  // Someone already signed in (or a session restored from storage) goes straight on.
  if (!isLoading && user && !isSubmitting) {
    return <Navigate replace to={redirectTo} />;
  }

  return (
    <main>
      <PageMeta title="Sign in | nokta" description="Sign in to nokta to sync saved venues, follow booking requests and share shortlists." canonicalPath="/sign-in" />
      <AuthShell
        title="Sign in"
        description={redirectParam ? "Sign in to pick up where you left off." : "Your saved venues, bookings and shortlists are waiting."}
        footer={
          <p>
            New to nokta?{" "}
            <Link to={withRedirect("/sign-up", redirectParam)} className={authLinkClass}>
              Create an account
            </Link>
          </p>
        }
      >
        {justConfirmed ? (
          <p className="mb-6 flex items-start gap-3 rounded-xl bg-forest-50 px-4 py-3 text-sm leading-relaxed text-nokta-ink">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-forest-400" />
            Email confirmed. Sign in to finish setting up.
          </p>
        ) : null}

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
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
            labelAside={
              <Link to={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="text-sm font-medium text-nokta-ink-muted underline-offset-4 hover:text-nokta-ink hover:underline">
                Forgot password?
              </Link>
            }
          />

          <AuthError message={error}>
            {needsConfirmation && email.trim() ? (
              resent ? (
                <span className="mt-1 block font-semibold">New link sent. Check your inbox.</span>
              ) : (
                <button type="button" onClick={handleResend} className="mt-1 block font-semibold underline underline-offset-4">
                  Send the confirmation link again
                </button>
              )
            ) : null}
          </AuthError>

          <button type="submit" className={authSubmitClass} disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </AuthShell>
    </main>
  );
}
