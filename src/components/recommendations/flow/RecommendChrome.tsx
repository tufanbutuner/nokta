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
