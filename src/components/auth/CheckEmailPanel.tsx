import { useState, type ReactNode } from "react";
import { MailCheck } from "lucide-react";
import { AuthError } from "@/components/auth/AuthError";
import { authLinkClass } from "@/components/auth/AuthField";
import { describeAuthError } from "@/lib/authErrors";

/**
 * "We sent you a link" — shared by sign-up confirmation and password reset.
 * Resend is offered because the first thing people do when no email arrives is
 * start again from scratch.
 */
export function CheckEmailPanel({ email, children, onResend, onChangeEmail }: {
  email: string | null;
  children: ReactNode;
  onResend?: () => Promise<void>;
  onChangeEmail?: () => void;
}) {
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!onResend) return;
    setError(null);
    setResendState("sending");
    try {
      await onResend();
      setResendState("sent");
    } catch (caughtError) {
      setError(describeAuthError(caughtError));
      setResendState("idle");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl bg-nokta-accent-tint/60 p-5">
        <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-nokta-accent-dark" />
        <div className="min-w-0 text-[15px] leading-relaxed text-nokta-ink">
          {email ? (
            <p>
              Sent to <span className="break-all font-semibold">{email}</span>.
            </p>
          ) : null}
          <div className={email ? "mt-1 text-nokta-ink-muted" : "text-nokta-ink-muted"}>{children}</div>
        </div>
      </div>

      <AuthError message={error} />

      {onResend || onChangeEmail ? (
        <p className="text-sm leading-relaxed text-nokta-ink-muted" aria-live="polite">
          Nothing after a few minutes? Check spam
          {onResend ? (
            resendState === "sent" ? (
              <>, then give the new link a minute. <span className="font-semibold text-nokta-ink">Sent again.</span></>
            ) : (
              <>
                , or{" "}
                <button type="button" onClick={handleResend} disabled={resendState === "sending" || !email} className={authLinkClass}>
                  {resendState === "sending" ? "sending…" : "send it again"}
                </button>
                .
              </>
            )
          ) : (
            "."
          )}
          {onChangeEmail ? (
            <>
              {" "}
              Wrong address?{" "}
              <button type="button" onClick={onChangeEmail} className={authLinkClass}>
                Use a different email
              </button>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
