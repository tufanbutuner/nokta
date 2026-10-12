import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField, authLinkClass, authSubmitClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckEmailPanel } from "@/components/auth/CheckEmailPanel";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/context/AuthContext";
import { describeAuthError } from "@/lib/authErrors";

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    setFieldError(trimmedEmail ? undefined : "Enter the email you signed up with.");
    if (!trimmedEmail) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setSubmittedEmail(trimmedEmail);
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const footer = (
    <p>
      Remembered it?{" "}
      <Link to="/sign-in" className={authLinkClass}>
        Back to sign in
      </Link>
    </p>
  );

  return (
    <main>
      <PageMeta title="Reset your password | nokta" description="Get a link to choose a new nokta password." canonicalPath="/forgot-password" />
      {submittedEmail ? (
        <AuthShell title="Check your email" showPerks={false} footer={footer}>
          <CheckEmailPanel email={submittedEmail} onResend={() => requestPasswordReset(submittedEmail)} onChangeEmail={() => setSubmittedEmail(null)}>
            If there's a nokta account for that address, the email has a link to choose a new password.
          </CheckEmailPanel>
        </AuthShell>
      ) : (
        <AuthShell
          title="Reset your password"
          description="Enter the email you signed up with and we'll send a link to choose a new one."
          showPerks={false}
          footer={footer}
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
              error={fieldError}
              onChange={(event) => setEmail(event.target.value)}
            />
            <AuthError message={error} />
            <button type="submit" className={authSubmitClass} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </AuthShell>
      )}
    </main>
  );
}
