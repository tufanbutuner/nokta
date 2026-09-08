import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEGACY_STARTER_PLAN_OPTION, PLAN_OPTIONS } from "@/lib/planConfig";
import type { VenuePlan, VenueSubscription, VenueSubscriptionStatus } from "@/types/subscriptions";

const STATUS_OPTIONS = [
  { label: "Inactive", value: "inactive" },
  { label: "Trial", value: "trial" },
  { label: "Active", value: "active" },
  { label: "Past due", value: "past_due" },
  { label: "Cancelled", value: "cancelled" },
];

export function AdminSubscriptionEditDialog({
  subscription,
  onClose,
  onSave,
  isSaving,
}: {
  subscription: VenueSubscription;
  onClose: () => void;
  onSave: (input: { plan: VenuePlan; status: VenueSubscriptionStatus; currentPeriodStart: string | null; currentPeriodEnd: string | null; adminNotes: string | null }) => Promise<void>;
  isSaving: boolean;
}) {
  const [plan, setPlan] = useState<VenuePlan>(subscription.plan);
  const [status, setStatus] = useState<VenueSubscriptionStatus>(subscription.status);
  const [currentPeriodStart, setCurrentPeriodStart] = useState(toDateInput(subscription.currentPeriodStart));
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(toDateInput(subscription.currentPeriodEnd));
  const [adminNotes, setAdminNotes] = useState(subscription.adminNotes ?? "");

  useEffect(() => {
    setPlan(subscription.plan);
    setStatus(subscription.status);
    setCurrentPeriodStart(toDateInput(subscription.currentPeriodStart));
    setCurrentPeriodEnd(toDateInput(subscription.currentPeriodEnd));
    setAdminNotes(subscription.adminNotes ?? "");
  }, [subscription]);

  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center bg-black/35 p-4">
      <form
        className="w-full max-w-xl rounded-xl border bg-card p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            plan,
            status,
            currentPeriodStart: fromDateInput(currentPeriodStart),
            currentPeriodEnd: fromDateInput(currentPeriodEnd),
            adminNotes,
          });
        }}
      >
        <h2 className="font-brand text-2xl font-bold tracking-[-0.5px]">Edit subscription</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Plan">
            <Select value={plan} onValueChange={(value) => setPlan(value as VenuePlan)} options={subscription.plan === "starter" ? [...PLAN_OPTIONS, LEGACY_STARTER_PLAN_OPTION] : PLAN_OPTIONS} />
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={(value) => setStatus(value as VenueSubscriptionStatus)} options={STATUS_OPTIONS} />
          </Field>
          <Field label="Current period start">
            <Input type="date" value={currentPeriodStart} onChange={(event) => setCurrentPeriodStart(event.target.value)} />
          </Field>
          <Field label="Current period end">
            <Input type="date" value={currentPeriodEnd} onChange={(event) => setCurrentPeriodEnd(event.target.value)} />
          </Field>
        </div>
        <Field label="Admin notes" className="mt-4">
          <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={4} />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save subscription"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={className}><span className="mb-2 block text-sm font-medium">{label}</span>{children}</label>;
}

function toDateInput(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

function fromDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}
