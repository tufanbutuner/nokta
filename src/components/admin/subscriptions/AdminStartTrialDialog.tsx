import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PaidVenuePlan } from "@/lib/stripePlanConfig";

const PAID_PLAN_OPTIONS = [
  { label: "Growth", value: "growth" },
  { label: "Pro", value: "pro" },
];

export function AdminStartTrialDialog({
  venueName,
  onClose,
  onStart,
  isSaving,
}: {
  venueName: string;
  onClose: () => void;
  onStart: (input: { plan: PaidVenuePlan; trialDays: number; adminNotes: string | null }) => Promise<void>;
  isSaving: boolean;
}) {
  const [plan, setPlan] = useState<PaidVenuePlan>("growth");
  const [trialDays, setTrialDays] = useState(14);
  const [adminNotes, setAdminNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center bg-black/35 p-4">
      <form
        className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onStart({ plan, trialDays, adminNotes });
        }}
      >
        <h2 className="font-brand text-2xl font-bold tracking-[-0.5px]">Start trial</h2>
        <p className="mt-1 text-sm text-muted-foreground">{venueName}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="mb-2 block text-sm font-medium">Plan</span><Select value={plan} onValueChange={(value) => setPlan(value as PaidVenuePlan)} options={PAID_PLAN_OPTIONS} /></label>
          <label><span className="mb-2 block text-sm font-medium">Trial days</span><Input type="number" min={1} max={90} value={trialDays} onChange={(event) => setTrialDays(Number(event.target.value))} /></label>
        </div>
        <label className="mt-4 block"><span className="mb-2 block text-sm font-medium">Admin notes</span><Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={4} /></label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Starting..." : "Start trial"}</Button>
        </div>
      </form>
    </div>
  );
}
