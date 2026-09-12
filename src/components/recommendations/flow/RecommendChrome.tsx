import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The flow owns the whole viewport: dark canvas, its own header, no site chrome.
 * `container-type: inline-size` is what makes every `cqi` size below resolve against
 * the canvas width rather than the viewport, so the flow scales inside any shell.
 */
export function RecommendCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-y-auto bg-[#141312] font-primary text-white [container-type:inline-size]">
      <AmbientGlow />
      {children}
    </div>
  );
}

function AmbientGlow() {
  return <div aria-hidden="true" className="pointer-events-none absolute -top-[30%] right-[-12%] w-[72%] rounded-full [aspect-ratio:1] [background:radial-gradient(circle,rgba(196,93,62,.30),transparent_68%)]" />;
}

export function RecommendHeader({ progress, stepLabel }: { progress: string; stepLabel: string }) {
  return (
    <header className="relative z-10 flex flex-none items-center gap-4 px-[clamp(18px,3.4cqi,40px)] py-[clamp(16px,2.6cqi,26px)]">
      <span className="text-[15px] font-semibold tracking-[-0.2px]">nokta</span>
      <div className="h-[3px] flex-1 rounded-sm bg-white/15">
        <div className="h-full rounded-sm bg-clay-accent transition-[width] duration-[350ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none" style={{ width: progress }} />
      </div>
      <span className="font-mono text-[11.5px] font-medium leading-none tracking-[0.08em] text-white/50">{stepLabel}</span>
    </header>
  );
}

export function RecommendEyebrow({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "warning" }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", tone === "warning" ? "text-[#e0b05f]" : "text-[#e0805f]")}>{children}</p>;
}

/** Depth comes from border and fill alpha only — there are no shadows anywhere in this design. */
export const PRIMARY_BUTTON = "inline-flex items-center justify-center rounded-[11px] bg-clay-accent font-semibold text-white transition-colors hover:bg-[#d46c4c] disabled:opacity-60";
export const OUTLINE_BUTTON = "inline-flex items-center justify-center rounded-[11px] border border-white/20 bg-transparent font-medium text-white transition-colors hover:border-white";
export const TEXT_LINK = "text-[13.5px] font-medium text-white/55 transition-colors hover:text-white";

/**
 * In-canvas loading and error states. The shared LoadingState/ErrorState are
 * white cards built for the light pages and read as foreign objects here.
 */
export function RecommendLoading({ message }: { message: string }) {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center px-[clamp(18px,3.4cqi,40px)] pb-16" role="status" aria-label={message}>
      <span className="h-1 w-28 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-clay-accent" />
      </span>
      <span className="sr-only">{message}</span>
    </div>
  );
}

export function RecommendError({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-[clamp(18px,3.4cqi,40px)] pb-16 text-center">
      <div className="grid max-w-[420px] gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e0b05f]">Something went wrong</p>
        <p className="text-[15px] leading-[1.5] text-white/[.82]">{message}</p>
      </div>
      {children}
    </div>
  );
}
