import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import { validateVenueEnquiryInput } from "@/lib/venueEnquiryValidation";
import type { VenueEnquiryInput, VenueEnquiryType } from "@/types/venueEnquiries";

const ENQUIRY_TYPES: VenueEnquiryType[] = ["general", "birthday", "group", "football", "late-night", "private-hire"];

export function VenueEnquiryForm({
  venueId,
  defaultEmail,
  isSubmitting,
  onSubmit,
}: {
  venueId: string;
  defaultEmail?: string | null;
  isSubmitting: boolean;
  onSubmit: (input: VenueEnquiryInput) => Promise<void>;
}) {
  const [values, setValues] = useState<VenueEnquiryInput>({
    venueId,
    enquiryType: "general",
    partySize: null,
    preferredDate: "",
    preferredTime: "",
    customerName: "",
    customerEmail: defaultEmail ?? "",
    customerPhone: "",
    message: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const validation = useMemo(() => validateVenueEnquiryInput(values), [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSubmit(values);
  }

  function update<K extends keyof VenueEnquiryInput>(key: K, value: VenueEnquiryInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Send enquiry</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Tell the venue what you are planning. This sends an enquiry only and does not confirm a booking.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enquiry type" error={showErrors ? validation.errors.enquiryType : undefined}>
          <Select value={values.enquiryType} onChange={(event) => update("enquiryType", event.target.value as VenueEnquiryType)} options={ENQUIRY_TYPES.map((type) => ({ label: formatVenueEnquiryType(type), value: type }))} />
        </Field>
        <Field label="Party size" error={showErrors ? validation.errors.partySize : undefined}>
          <Input type="number" min={1} max={100} value={values.partySize ?? ""} onChange={(event) => update("partySize", event.target.value ? Number(event.target.value) : null)} />
        </Field>
        <Field label="Preferred date" error={showErrors ? validation.errors.preferredDate : undefined}>
          <Input type="date" value={values.preferredDate ?? ""} onChange={(event) => update("preferredDate", event.target.value)} />
        </Field>
        <Field label="Preferred time" error={showErrors ? validation.errors.preferredTime : undefined}>
          <Input type="time" value={values.preferredTime ?? ""} onChange={(event) => update("preferredTime", event.target.value)} />
        </Field>
        <Field label="Your name" error={showErrors ? validation.errors.customerName : undefined}>
          <Input value={values.customerName} onChange={(event) => update("customerName", event.target.value)} />
        </Field>
        <Field label="Your email" error={showErrors ? validation.errors.customerEmail : undefined}>
          <Input type="email" value={values.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} />
        </Field>
        <Field label="Your phone" error={showErrors ? validation.errors.customerPhone : undefined}>
          <Input value={values.customerPhone ?? ""} onChange={(event) => update("customerPhone", event.target.value)} />
        </Field>
      </div>
      <Field label="Message" error={showErrors ? validation.errors.message : undefined}>
        <Textarea value={values.message ?? ""} onChange={(event) => update("message", event.target.value)} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send enquiry"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}
