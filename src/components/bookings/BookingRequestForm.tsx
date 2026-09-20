import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateCreateBookingRequestInput } from "@/lib/bookingRequestValidation";
import { checkBookingAvailability } from "@/lib/bookingAvailabilityValidation";
import { FALLBACK_TIME_OPTIONS, getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { CreateBookingRequestInput } from "@/types/bookingRequests";

const OCCASION_OPTIONS = ["General", "Birthday", "Group booking", "Football night", "Private hire", "Date night", "Other"];

export function BookingRequestForm({
  venueId,
  defaultEmail,
  isSubmitting,
  onSubmit,
  availability,
  initialValues,
}: {
  venueId: string;
  defaultEmail?: string | null;
  isSubmitting: boolean;
  availability?: VenueBookingAvailability | null;
  initialValues?: Partial<Pick<CreateBookingRequestInput, "partySize" | "requestedDate" | "requestedTime">>;
  onSubmit: (input: CreateBookingRequestInput) => Promise<void>;
}) {
  const [values, setValues] = useState<CreateBookingRequestInput>({
    venueId,
    customerName: "",
    customerEmail: defaultEmail ?? "",
    customerPhone: "",
    partySize: initialValues?.partySize ?? 2,
    requestedDate: initialValues?.requestedDate ?? "",
    requestedTime: initialValues?.requestedTime ?? "",
    occasion: "General",
    message: "",
    sourceSurface: "venue_page",
  });
  const [showErrors, setShowErrors] = useState(false);
  const validation = useMemo(() => validateCreateBookingRequestInput(values), [values]);
  const availabilityCheck = useMemo(() => availability && values.requestedDate && values.requestedTime ? checkBookingAvailability({ availability, requestedDate: values.requestedDate, requestedTime: values.requestedTime, partySize: values.partySize }) : null, [availability, values.partySize, values.requestedDate, values.requestedTime]);
  /**
   * Match the sidebar card: always a list of times to choose from. Falling back
   * to a bare clock input before availability loads made the same booking look
   * like two different forms depending on where it was started.
   */
  const timeOptions = useMemo(() => {
    const available = availability && values.requestedDate ? getBookingTimeOptions({ availability, selectedDate: values.requestedDate }) : [];
    return available.length ? available : FALLBACK_TIME_OPTIONS;
  }, [availability, values.requestedDate]);
  const disabled = availability?.settings.bookingRequestsEnabled === false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    if (availabilityCheck && !availabilityCheck.isAvailable) return;
    await onSubmit(values);
  }

  function update<K extends keyof CreateBookingRequestInput>(key: K, value: CreateBookingRequestInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Request booking</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{availability?.settings.bookingInstructions ?? "This sends a request to the venue. Your booking is not confirmed until the venue accepts it."}</p>
      </div>
      {disabled ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Booking requests are currently unavailable for this venue.</div> : null}
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
          <Input className="text-base sm:text-sm" type="number" min={availability?.settings.minPartySize ?? 1} max={availability?.settings.maxPartySize ?? 100} value={values.partySize} onChange={(event) => update("partySize", event.target.value ? Number(event.target.value) : 0)} />
        </Field>
        <Field label="Date" error={showErrors ? validation.errors.requestedDate : undefined}>
          <Input className="text-base sm:text-sm" type="date" value={values.requestedDate} onChange={(event) => update("requestedDate", event.target.value)} />
        </Field>
        <Field label="Time" error={showErrors ? validation.errors.requestedTime : undefined}>
          <Select className="text-base sm:text-sm" value={values.requestedTime} placeholder="Choose a time" onValueChange={(time) => update("requestedTime", time)} options={timeOptions.map((time) => ({ label: time, value: time }))} disabled={!values.requestedDate} />
        </Field>
        <Field label="Occasion" error={showErrors ? validation.errors.occasion : undefined}>
          <Select value={values.occasion ?? "General"} onValueChange={(occasion) => update("occasion", occasion)} options={OCCASION_OPTIONS.map((occasion) => ({ label: occasion, value: occasion }))} />
        </Field>
      </div>
      <Field label="Message" error={showErrors ? validation.errors.message : undefined}>
        <Textarea value={values.message ?? ""} onChange={(event) => update("message", event.target.value)} placeholder="Anything the venue should know?" />
      </Field>
      {showErrors && availabilityCheck && !availabilityCheck.isAvailable ? <div className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{availabilityCheck.errors[0]}</div> : null}
      <Button type="submit" disabled={isSubmitting || disabled}>{isSubmitting ? "Sending..." : "Send booking request"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}
