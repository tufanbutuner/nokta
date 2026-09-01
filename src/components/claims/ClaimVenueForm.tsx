import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateVenueClaimRequestInput } from "@/lib/venueClaimValidation";
import type { VenueClaimRequestInput, VenueClaimantRole } from "@/types/venueClaims";

const ROLE_OPTIONS: { label: string; value: VenueClaimantRole }[] = [
  { label: "Owner", value: "owner" },
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "employee" },
  { label: "Marketing / agency", value: "marketing" },
  { label: "Other", value: "other" },
];

export function ClaimVenueForm({
  venueId,
  defaultEmail,
  isSubmitting,
  error,
  onSubmit,
}: {
  venueId: string;
  defaultEmail?: string | null;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (input: VenueClaimRequestInput) => Promise<void>;
}) {
  const [values, setValues] = useState<VenueClaimRequestInput>({
    venueId,
    claimantName: "",
    claimantEmail: defaultEmail ?? "",
    claimantPhone: "",
    claimantRole: "owner",
    businessEmail: "",
    businessPhone: "",
    proofNotes: "",
    proofUrl: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const validation = useMemo(() => validateVenueClaimRequestInput(values), [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);

    if (!validation.isValid) {
      return;
    }

    await onSubmit(values);
  }

  function update<K extends keyof VenueClaimRequestInput>(key: K, value: VenueClaimRequestInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Claim this venue</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tell us how you are connected to this venue. The Nokta team reviews every claim before enabling owner access.
        </p>
      </div>

      {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={showErrors ? validation.errors.claimantName : undefined}>
          <Input value={values.claimantName} onChange={(event) => update("claimantName", event.target.value)} />
        </Field>
        <Field label="Your role" error={showErrors ? validation.errors.claimantRole : undefined}>
          <Select value={values.claimantRole} onChange={(event) => update("claimantRole", event.target.value as VenueClaimantRole)} options={ROLE_OPTIONS} className="w-full" />
        </Field>
        <Field label="Your email" error={showErrors ? validation.errors.claimantEmail : undefined}>
          <Input type="email" value={values.claimantEmail} onChange={(event) => update("claimantEmail", event.target.value)} />
        </Field>
        <Field label="Your phone" error={showErrors ? validation.errors.claimantPhone : undefined}>
          <Input value={values.claimantPhone ?? ""} onChange={(event) => update("claimantPhone", event.target.value)} />
        </Field>
        <Field label="Business email, if different" error={showErrors ? validation.errors.businessEmail : undefined}>
          <Input type="email" value={values.businessEmail ?? ""} onChange={(event) => update("businessEmail", event.target.value)} />
        </Field>
        <Field label="Business phone, if different" error={showErrors ? validation.errors.businessPhone : undefined}>
          <Input value={values.businessPhone ?? ""} onChange={(event) => update("businessPhone", event.target.value)} />
        </Field>
      </div>

      <Field label="Proof link" error={showErrors ? validation.errors.proofUrl : undefined}>
        <Input placeholder="Website, booking page, Companies House profile or social link" value={values.proofUrl ?? ""} onChange={(event) => update("proofUrl", event.target.value)} />
      </Field>

      <Field label="Anything else we should know?" error={showErrors ? validation.errors.proofNotes : undefined}>
        <Textarea value={values.proofNotes ?? ""} onChange={(event) => update("proofNotes", event.target.value)} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit claim request"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}
