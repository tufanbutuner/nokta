import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  /** Rendered beside the label, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
}

const inputClass =
  "h-12 w-full rounded-xl border border-nokta-border-input bg-nokta-surface px-4 text-base text-nokta-ink caret-nokta-accent transition-[border-color,box-shadow] placeholder:text-nokta-ink-muted/70 focus:border-nokta-accent focus:outline-none focus:ring-4 focus:ring-nokta-accent/15 disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/15";

/** Label, input, hint and inline error wired together for screen readers. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, hint, error, labelAside, type = "text", className, ...props },
  ref,
) {
  const id = useId();
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-nokta-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && isRevealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, isPassword && "pr-14", className)}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsRevealed((value) => !value)}
            aria-label={isRevealed ? "Hide password" : "Show password"}
            aria-pressed={isRevealed}
            className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-lg text-nokta-ink-muted transition-colors hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isRevealed ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-nokta-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const authLinkClass =
  "font-semibold text-nokta-ink underline decoration-nokta-accent/50 decoration-2 underline-offset-4 transition-colors hover:decoration-nokta-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

export const authSubmitClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-nokta-ink text-base font-semibold text-nokta-surface transition-[background-color,transform] hover:bg-nokta-ink/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";
