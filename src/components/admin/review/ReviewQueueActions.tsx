import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewQueueActionBar({
  primaryLabel,
  secondaryLabel,
  rejectLabel,
  isBusy,
  canReject,
  venueFormHref,
  onPrimary,
  onSecondary,
  onReject,
}: {
  primaryLabel: string;
  secondaryLabel?: string;
  rejectLabel: string;
  isBusy: boolean;
  canReject: boolean;
  venueFormHref?: string | null;
  onPrimary: () => void;
  onSecondary?: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={onPrimary} disabled={isBusy} className="h-[38px] px-[15px] text-[13.5px]">{primaryLabel}</Button>
      {secondaryLabel && onSecondary ? (
        <Button type="button" variant="outline" onClick={onSecondary} disabled={isBusy} className="h-[38px] px-[14px] text-[13.5px]">{secondaryLabel}</Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={onReject}
        disabled={isBusy || !canReject}
        title={canReject ? undefined : "Add a note before rejecting"}
        className="h-[38px] border-[oklch(0.86_0.05_25)] px-[14px] text-[13.5px] text-[oklch(0.42_0.09_25)] hover:bg-[oklch(0.97_0.02_25)]"
      >
        {rejectLabel}
      </Button>
      {venueFormHref ? (
        <Button asChild variant="outline" className="ml-auto h-[38px] px-[14px] text-[13.5px]">
          <Link to={venueFormHref}>Open venue form</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function OwnerNoteCard({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <section className="rounded-xl border bg-card px-[18px] py-4">
      <h3 className="text-[10.5px] font-semibold uppercase tracking-[1.6px] text-muted-foreground">Owner's note</h3>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-nokta-ink">{note}</p>
    </section>
  );
}

export function AdminNoteCard({
  value,
  chips,
  isRequired,
  requiredHint,
  onChange,
}: {
  value: string;
  chips: string[];
  isRequired: boolean;
  requiredHint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-xl border bg-card px-[18px] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-nokta-ink">Admin note</h3>
        <span className="text-[11.5px] text-muted-foreground">Sent to the owner on reject</span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Why this was rejected, or anything worth recording…"
        className="mt-2 min-h-[60px] text-[13px]"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            className={cn(
              "rounded-full border bg-[oklch(0.96_0.02_55)] px-[10px] py-[5px] text-xs text-nokta-ink transition-colors hover:border-clay-accent",
              value === chip && "border-clay-accent bg-clay-accent/10 font-medium",
            )}
          >
            {chip}
          </button>
        ))}
      </div>
      {isRequired && !value.trim() ? <p className="mt-2 text-xs text-[oklch(0.42_0.09_25)]">{requiredHint ?? "A note is required to reject."}</p> : null}
    </section>
  );
}

export function DetailSideRail({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-[14px]">{children}</div>;
}

export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card px-[15px] py-[14px]">
      <h3 className="text-[13px] font-semibold text-nokta-ink">{title}</h3>
      <div className="mt-1.5 text-[11.5px] leading-[1.55] text-muted-foreground">{children}</div>
    </section>
  );
}
