import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateCreateBookingRequestInput } from "@/lib/bookingRequestValidation";
import type { CreateBookingRequestInput } from "@/types/bookingRequests";

const OCCASION_OPTIONS = ["General", "Birthday", "Group booking", "Football night", "Private hire", "Date night", "Other"];

export function BookingRequestForm({
  venueId,
  defaultEmail,
  isSubmitting,
  onSubmit,
}: {
  venueId: string;
  defaultEmail?: string | null;
  isSubmitting: boolean;
  onSubmit: (input: CreateBookingRequestInput) => Promise<void>;
}) {
  const [values, setValues] = useState<CreateBookingRequestInput>({
    venueId,
    customerName: "",
    customerEmail: defaultEmail ?? "",
    customerPhone: "",
    partySize: 2,
    requestedDate: "",
    requestedTime: "",
    occasion: "General",
    message: "",
    sourceSurface: "venue_page",
  });
  const [showErrors, setShowErrors] = useState(false);
  const validation = useMemo(() => validateCreateBookingRequestInput(values), [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSubmit(values);
  }

  function update<K extends keyof CreateBookingRequestInput>(key: K, value: CreateBookingRequestInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Request booking</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This sends a request to the venue. Your booking is not confirmed until the venue accepts it.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={showErrors ? validation.errors.customerName : undefined}>
          <Input value={values.customerName} onChange={(event) => update("customerName", event.target.value)} />
        </Field>
        <Field label="Email" error={showErrors ? validation.errors.customerEmail : undefined}>
          <Input type="email" value={values.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} />
        </Field>
        <Field label="Phone" error={showErrors ? validation.errors.customerPhone : undefined}>
          <Input value={values.customerPhone ?? ""} onChange={(event) => update("customerPhone", event.target.value)} />
        </Field>
        <Field label="Party size" error={showErrors ? validation.errors.partySize : undefined}>
          <Input type="number" min={1} max={100} value={values.partySize} onChange={(event) => update("partySize", event.target.value ? Number(event.target.value) : 0)} />
        </Field>
        <Field label="Date" error={showErrors ? validation.errors.requestedDate : undefined}>
          <Input type="date" value={values.requestedDate} onChange={(event) => update("requestedDate", event.target.value)} />
        </Field>
        <Field label="Time" error={showErrors ? validation.errors.requestedTime : undefined}>
          <Input type="time" value={values.requestedTime} onChange={(event) => update("requestedTime", event.target.value)} />
        </Field>
        <Field label="Occasion" error={showErrors ? validation.errors.occasion : undefined}>
          <Select value={values.occasion ?? "General"} onValueChange={(occasion) => update("occasion", occasion)} options={OCCASION_OPTIONS.map((occasion) => ({ label: occasion, value: occasion }))} />
        </Field>
      </div>
      <Field label="Message" error={showErrors ? validation.errors.message : undefined}>
        <Textarea value={values.message ?? ""} onChange={(event) => update("message", event.target.value)} placeholder="Anything the venue should know?" />
      </Field>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send booking request"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}
