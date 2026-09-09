import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastState {
  type: "success" | "error";
  title?: string;
  message: string;
}

/** Auto-dismisses after `duration`; errors stay until closed by default. */
export function useToastTimeout(toast: ToastState | null, onExpire: () => void, duration = 4500) {
  useEffect(() => {
    if (!toast || toast.type === "error") return;
    const timeoutId = window.setTimeout(onExpire, duration);
    return () => window.clearTimeout(timeoutId);
  }, [toast, onExpire, duration]);
}

/**
 * `offsetBottom` lifts the toast clear of a fixed action bar on the same screen.
 */
export function Toast({ type, title, message, onClose, offsetBottom }: ToastState & { onClose: () => void; offsetBottom?: boolean }) {
  const isSuccess = type === "success";

  return (
    <div role="status" aria-live="polite" className={cn("fixed right-5 z-[80] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-nokta-border bg-white p-4 shadow-2xl shadow-stone-950/15", offsetBottom ? "bottom-[calc(96px+env(safe-area-inset-bottom))]" : "bottom-5")}>
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-nokta-ink">{title ?? (isSuccess ? "Saved" : "Something went wrong")}</p>
          <p className="mt-1 text-sm leading-5 text-nokta-ink-muted">{message}</p>
        </div>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-full px-2 py-1 text-xs font-semibold text-nokta-ink-muted hover:bg-nokta-ink/5 hover:text-nokta-ink">
          Close
        </button>
      </div>
    </div>
  );
}
