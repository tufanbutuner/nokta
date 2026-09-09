import type { ProfileDiffRow } from "@/lib/venueProfileDiff";

/**
 * Before/after rows, shared by the sticky bar's review panel and the rail's
 * past requests. Cells stack on narrow widths, so the strike-through carries
 * the "before" meaning rather than a column header.
 */
export function ProfileDiffTable({ rows, compact }: { rows: ProfileDiffRow[]; compact?: boolean }) {
  if (!rows.length) return <p className="text-[13px] text-nokta-ink-muted">No field changes recorded.</p>;

  return (
    <div className="overflow-hidden rounded-[11px] border border-nokta-row-border">
      {rows.map((row) => (
        <div
          key={row.field}
          className={`grid items-start gap-x-3.5 gap-y-1 border-b border-nokta-divider-row px-3.5 py-[11px] text-[13px] last:border-b-0 ${compact ? "[grid-template-columns:1fr]" : "[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"}`}
        >
          <span className="font-medium text-nokta-ink">{row.label}</span>
          <span className="text-nokta-ink-muted line-through [text-decoration-color:oklch(0.75_0.05_30)]">{row.before}</span>
          <span className="text-nokta-ink">{row.after}</span>
        </div>
      ))}
    </div>
  );
}
