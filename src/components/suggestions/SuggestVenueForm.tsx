import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCityOptions, DEFAULT_CITY, DEFAULT_COUNTRY } from "@/lib/cities";
import { validateVenueSuggestionInput } from "@/lib/venueSuggestionValidation";
import type { VenueSuggestionInput } from "@/types/venueSuggestions";

type SubmitterIntent = "customer" | "owner" | "staff" | "other";

const INITIAL_VALUES: VenueSuggestionInput = {
  venueName: "",
  country: DEFAULT_COUNTRY,
  city: DEFAULT_CITY,
  area: "",
  address: "",
  postcode: "",
  website: "",
  instagram: "",
  phone: "",
  notes: "",
};

export function SuggestVenueForm({
  existingVenueNames,
  isSubmitting,
  onSubmit,
}: {
  existingVenueNames: string[];
  isSubmitting?: boolean;
  onSubmit: (input: VenueSuggestionInput) => Promise<void>;
}) {
  const [values, setValues] = useState<VenueSuggestionInput>(INITIAL_VALUES);
  const [submitterIntent, setSubmitterIntent] = useState<SubmitterIntent>("customer");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const normalizedVenueName = values.venueName.trim().toLowerCase();
  const mayAlreadyExist = Boolean(normalizedVenueName && existingVenueNames.some((name) => name.trim().toLowerCase() === normalizedVenueName));
  const isOwnerIntent = submitterIntent === "owner" || submitterIntent === "staff";

  function update<Key extends keyof VenueSuggestionInput>(key: Key, value: VenueSuggestionInput[Key]) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateVenueSuggestionInput(values);
    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    await onSubmit({ ...values, notes: buildSuggestionNotes(values.notes, { submitterIntent, ownerName, ownerEmail, ownerPhone }) });
    setValues(INITIAL_VALUES);
    setSubmitterIntent("customer");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {mayAlreadyExist ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              This venue may already be listed. Please check Discover before submitting.
            </Alert>
          ) : null}

          <Field label="Venue name" error={errors.venueName}>
            <Input value={values.venueName} onChange={(event) => update("venueName", event.target.value)} placeholder="Broski Lounge" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" error={errors.country}>
              <Input value={values.country} onChange={(event) => update("country", event.target.value)} />
            </Field>
            <Field label="City" error={errors.city}>
              <Select
                value={values.city}
                onChange={(event) => update("city", event.target.value)}
                options={getCityOptions({ activeOnly: true })}
                className="w-full"
              />
            </Field>
            <Field label="Area" error={errors.area}>
              <Input value={values.area ?? ""} onChange={(event) => update("area", event.target.value)} placeholder="Fitzrovia" />
            </Field>
            <Field label="Postcode" error={errors.postcode}>
              <Input value={values.postcode ?? ""} onChange={(event) => update("postcode", event.target.value)} placeholder="W1T 5EE" />
            </Field>
          </div>

          <Field label="Address" error={errors.address}>
            <Input value={values.address ?? ""} onChange={(event) => update("address", event.target.value)} placeholder="Street address if you know it" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" error={errors.website}>
              <Input value={values.website ?? ""} onChange={(event) => update("website", event.target.value)} placeholder="https://" />
            </Field>
            <Field label="Instagram" error={errors.instagram}>
              <Input value={values.instagram ?? ""} onChange={(event) => update("instagram", event.target.value)} placeholder="https://instagram.com/..." />
            </Field>
          </div>

          <Field label="Phone" error={errors.phone}>
            <Input value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} placeholder="Optional" />
          </Field>

          <div className="rounded-md border border-border bg-muted/20 p-4">
            <Field label="I am" error={errors.submitterIntent}>
              <Select
                value={submitterIntent}
                onChange={(event) => setSubmitterIntent(event.target.value as SubmitterIntent)}
                options={[
                  { label: "A customer suggesting a place", value: "customer" },
                  { label: "The owner", value: "owner" },
                  { label: "Part of the venue team", value: "staff" },
                  { label: "Something else", value: "other" },
                ]}
                className="w-full"
              />
            </Field>

            {isOwnerIntent ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Your name">
                  <Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Full name" />
                </Field>
                <Field label="Business email">
                  <Input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} placeholder="name@venue.com" />
                </Field>
                <Field label="Business phone">
                  <Input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="Optional" />
                </Field>
              </div>
            ) : null}
          </div>

          <Field label="Notes" error={errors.notes}>
            <Textarea
              value={values.notes ?? ""}
              maxLength={1000}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Anything useful for review: opening hours, shisha area, menu links, whether it is still active..."
            />
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit suggestion"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function buildSuggestionNotes(
  notes: string | null | undefined,
  ownerContext: { submitterIntent: SubmitterIntent; ownerName: string; ownerEmail: string; ownerPhone: string },
) {
  const lines = [
    notes?.trim(),
    `Submitter type: ${ownerContext.submitterIntent}`,
    ownerContext.ownerName.trim() ? `Owner/contact name: ${ownerContext.ownerName.trim()}` : null,
    ownerContext.ownerEmail.trim() ? `Business email: ${ownerContext.ownerEmail.trim()}` : null,
    ownerContext.ownerPhone.trim() ? `Business phone: ${ownerContext.ownerPhone.trim()}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
