import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { validateVenueBookingClosureDate, validateVenueBookingSettings, validateVenueBookingWindow } from "@/lib/bookingAvailabilityValidation";
import { toDateInputValue } from "@/lib/bookingCalendarDates";
import { cn } from "@/lib/utils";
import {
  createOwnerVenueBookingBlackoutDate,
  deleteOwnerVenueBookingBlackoutDate,
  getOwnerVenueBookingAvailability,
  replaceOwnerVenueBookingWindows,
  updateOwnerVenueBookingSettings,
} from "@/services/ownerBookingAvailabilityService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueBookingAvailability, VenueBookingSettings } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";

const NOTICE_OPTIONS = [
  { label: "No notice", value: "0" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
  { label: "1 day", value: "1440" },
  { label: "2 days", value: "2880" },
];

const ADVANCE_OPTIONS = [
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
];

/** The three day groups the design shows, mapped to JS day numbers. */
const DAY_GROUPS = [
  { key: "mon_thu", label: "Mon – Thu", days: [1, 2, 3, 4] },
  { key: "fri_sat", label: "Fri – Sat", days: [5, 6] },
  { key: "sun", label: "Sunday", days: [0] },
] as const;

interface GroupWindow {
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export function OwnerVenueBookingRulesPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const [settings, setSettings] = useState<Partial<VenueBookingSettings>>({});
  const [groups, setGroups] = useState<Record<string, GroupWindow>>({});
  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [closureError, setClosureError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenue({ userId: user.id, venueId }), getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId })])
      .then(([nextVenue, nextAvailability]) => {
        if (!nextVenue) throw new Error("We could not find that venue.");
        if (cancelled) return;
        setVenue(nextVenue);
        setAvailability(nextAvailability);
        setSettings(nextAvailability.settings);
        setGroups(toGroupWindows(nextAvailability));
        trackEvent("owner_booking_rules_viewed", { venueId: nextVenue.id });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load booking rules.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  const validation = useMemo(() => validateVenueBookingSettings(settings), [settings]);
  const windowErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const group of DAY_GROUPS) {
      const value = groups[group.key];
      if (!value?.isEnabled) continue;
      const result = validateVenueBookingWindow({ dayOfWeek: group.days[0], startTime: value.startTime, endTime: value.endTime });
      const firstError = Object.values(result.errors)[0];
      if (firstError) errors[group.key] = firstError;
    }
    return errors;
  }, [groups]);

  const canSave = validation.isValid && !Object.keys(windowErrors).length;

  async function handleSave() {
    if (!user || !venue || !canSave) return;
    try {
      setIsSaving(true);
      setError(null);
      await updateOwnerVenueBookingSettings({ ownerUserId: user.id, venueId: venue.id, settings });
      await replaceOwnerVenueBookingWindows({
        ownerUserId: user.id,
        venueId: venue.id,
        windows: DAY_GROUPS.flatMap((group) => {
          const value = groups[group.key];
          if (!value?.isEnabled) return [];
          return group.days.map((dayOfWeek) => ({ dayOfWeek, startTime: value.startTime, endTime: value.endTime, isEnabled: true }));
        }),
      });
      const nextAvailability = await getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: venue.id });
      setAvailability(nextAvailability);
      setNotice("Booking rules saved.");
      trackEvent("owner_booking_rules_saved", { venueId: venue.id });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save booking rules.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddClosure() {
    if (!user || !venue) return;
    const dateError = validateVenueBookingClosureDate(closureDate);
    if (dateError) {
      setClosureError(dateError);
      return;
    }
    try {
      setClosureError(null);
      await createOwnerVenueBookingBlackoutDate({
        ownerUserId: user.id,
        venueId: venue.id,
        blackoutDate: { blackoutDate: closureDate, reason: closureReason.trim() || null, isFullDay: true },
      });
      const nextAvailability = await getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: venue.id });
      setAvailability(nextAvailability);
      setClosureDate("");
      setClosureReason("");
    } catch (caughtError) {
      setClosureError(caughtError instanceof Error ? caughtError.message : "Could not add that closure.");
    }
  }

  async function handleRemoveClosure(blackoutDateId: string) {
    if (!user || !venue) return;
    try {
      await deleteOwnerVenueBookingBlackoutDate({ ownerUserId: user.id, venueId: venue.id, blackoutDateId });
      const nextAvailability = await getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId: venue.id });
      setAvailability(nextAvailability);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not remove that closure.");
    }
  }

  return (
    <OwnerLayout>
      <PageMeta title="Booking rules | nokta" description="Set when and how you take booking requests." canonicalPath={`/owner/venues/${venueId}/bookings/rules`} />
      {isLoading ? <LoadingState message="Loading booking rules..." /> : !venue || !availability ? <ErrorState message={error ?? "Could not load booking rules."} /> : (
        <OwnerVenueTabShell venue={venue} title="Booking rules">
          <div className="flex max-w-[560px] flex-col gap-3">
            {error ? <ErrorState message={error} /> : null}
            {notice ? <p className="rounded-lg border border-[oklch(0.86_0.06_150)] bg-[oklch(0.96_0.03_150)] px-3 py-2 text-[13px] text-[oklch(0.32_0.06_150)]">{notice}</p> : null}

            <RuleCard>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[14.5px] font-semibold text-nokta-ink">Accept booking requests</h2>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">Off hides the button on your public page.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.bookingRequestsEnabled ?? false}
                  aria-label="Accept booking requests"
                  onClick={() => setSettings({ ...settings, bookingRequestsEnabled: !settings.bookingRequestsEnabled })}
                  className={cn("flex h-[23px] w-10 flex-none items-center rounded-full p-[2px] transition-colors", settings.bookingRequestsEnabled ? "bg-clay-accent" : "bg-[oklch(0.86_0.015_55)]")}
                >
                  <span className={cn("h-[19px] w-[19px] rounded-full bg-white transition-transform", settings.bookingRequestsEnabled ? "translate-x-[17px]" : "translate-x-0")} />
                </button>
              </div>
            </RuleCard>

            <RuleCard>
              <h2 className="text-[14.5px] font-semibold text-nokta-ink">Who can request</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Smallest party" error={validation.errors.minPartySize}>
                  <Input type="number" min={1} value={settings.minPartySize ?? ""} onChange={(event) => setSettings({ ...settings, minPartySize: Number(event.target.value) })} className="h-9" />
                </Field>
                <Field label="Largest party" error={validation.errors.maxPartySize}>
                  <Input type="number" min={1} value={settings.maxPartySize ?? ""} onChange={(event) => setSettings({ ...settings, maxPartySize: Number(event.target.value) })} className="h-9" />
                </Field>
                <Field label="Minimum notice" error={validation.errors.minNoticeMinutes}>
                  <Select value={String(settings.minNoticeMinutes ?? 0)} onValueChange={(value) => setSettings({ ...settings, minNoticeMinutes: Number(value) })} options={NOTICE_OPTIONS} />
                </Field>
                <Field label="Booked ahead up to" error={validation.errors.maxAdvanceDays}>
                  <Select value={String(settings.maxAdvanceDays ?? 60)} onValueChange={(value) => setSettings({ ...settings, maxAdvanceDays: Number(value) })} options={ADVANCE_OPTIONS} />
                </Field>
              </div>
              <p className="mt-2.5 text-[11.5px] text-muted-foreground">A party of {(settings.maxPartySize ?? 20) + 4} sees “call the venue” instead of the request form.</p>
            </RuleCard>

            <RuleCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14.5px] font-semibold text-nokta-ink">When requests are allowed</h2>
                <button
                  type="button"
                  onClick={() => {
                    const monday = groups.mon_thu;
                    if (!monday) return;
                    setGroups(Object.fromEntries(DAY_GROUPS.map((group) => [group.key, { ...monday }])));
                  }}
                  className="text-[12.5px] font-medium text-clay-accent hover:underline"
                >
                  Copy Mon to all
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {DAY_GROUPS.map((group) => {
                  const value = groups[group.key] ?? { startTime: "17:00", endTime: "23:00", isEnabled: false };
                  return (
                    <div key={group.key}>
                      <div className={cn("flex flex-wrap items-center gap-2 rounded-lg border p-2", !value.isEnabled && "border-dashed bg-[oklch(0.98_0.008_60)]")}>
                        <span className={cn("w-24 flex-none text-[12.5px]", value.isEnabled ? "text-nokta-ink" : "text-[oklch(0.58_0.02_42)]")}>{group.label}</span>
                        {value.isEnabled ? (
                          <>
                            <Input type="time" value={value.startTime} onChange={(event) => setGroups({ ...groups, [group.key]: { ...value, startTime: event.target.value } })} className="h-9 w-[120px]" aria-label={`${group.label} start time`} />
                            <span className="text-muted-foreground">–</span>
                            <Input type="time" value={value.endTime} onChange={(event) => setGroups({ ...groups, [group.key]: { ...value, endTime: event.target.value } })} className="h-9 w-[120px]" aria-label={`${group.label} end time`} />
                          </>
                        ) : (
                          <span className="flex-1 text-[12.5px] text-[oklch(0.58_0.02_42)]">No requests</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setGroups({ ...groups, [group.key]: { ...value, isEnabled: !value.isEnabled } })}
                          className="ml-auto text-[12.5px] font-medium text-clay-accent hover:underline"
                        >
                          {value.isEnabled ? "Turn off" : "Turn on"}
                        </button>
                      </div>
                      {windowErrors[group.key] ? <p className="mt-1 text-xs text-destructive">{windowErrors[group.key]}</p> : null}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-[1.5] text-muted-foreground">
                Narrower than your opening hours — 23:00 on a Tuesday is open for walk-ins but closed for requests.
              </p>
            </RuleCard>

            <RuleCard>
              <h2 className="text-[14.5px] font-semibold text-nokta-ink">Closures</h2>
              <div className="mt-3 flex flex-col gap-2">
                {availability.blackoutDates.length ? (
                  availability.blackoutDates.map((closure) => (
                    <div key={closure.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <div className="text-[12.5px] font-medium text-nokta-ink">{closure.blackoutDate}</div>
                        <div className="text-[11.5px] text-muted-foreground">{closure.reason ?? "Closed all day"}</div>
                      </div>
                      <button type="button" onClick={() => handleRemoveClosure(closure.id)} aria-label={`Remove closure on ${closure.blackoutDate}`} className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive sm:h-8 sm:w-8">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[12.5px] text-muted-foreground">No closures booked.</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label="Date">
                  <Input type="date" value={closureDate} min={toDateInputValue(new Date())} onChange={(event) => setClosureDate(event.target.value)} className="h-9 w-[160px]" />
                </Field>
                <Field label="Reason">
                  <Input value={closureReason} placeholder="private hire" onChange={(event) => setClosureReason(event.target.value)} className="h-9 w-[160px]" />
                </Field>
                <Button type="button" variant="outline" onClick={handleAddClosure} className="h-9 text-[12.5px]">+ Add</Button>
              </div>
              {closureError ? <p className="mt-1 text-xs text-destructive">{closureError}</p> : null}
            </RuleCard>

            <RuleCard>
              <h2 className="text-[14.5px] font-semibold text-nokta-ink">What customers are told</h2>
              <Textarea
                value={settings.bookingInstructions ?? ""}
                maxLength={140}
                onChange={(event) => setSettings({ ...settings, bookingInstructions: event.target.value })}
                className="mt-2 text-[13px]"
                placeholder="Shown above the request form on your public page."
              />
              <div className="mt-1 flex justify-between gap-3">
                {validation.errors.bookingInstructions ? <p className="text-xs text-destructive">{validation.errors.bookingInstructions}</p> : <span />}
                <span className="text-[11px] text-muted-foreground">{(settings.bookingInstructions ?? "").length}/140</span>
              </div>
            </RuleCard>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={handleSave} disabled={isSaving || !canSave} className="h-[38px] text-[13.5px]">
                {isSaving ? "Saving..." : "Save rules"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/owner/venues/${venue.slug}/bookings`)} className="h-[38px] text-[13.5px]">Cancel</Button>
            </div>
            <p className="text-[11.5px] text-muted-foreground">No admin review — these are operational, not public copy.</p>
          </div>
        </OwnerVenueTabShell>
      )}
    </OwnerLayout>
  );
}

function RuleCard({ children }: { children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card px-4 py-[15px]">{children}</section>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function toGroupWindows(availability: VenueBookingAvailability): Record<string, GroupWindow> {
  return Object.fromEntries(
    DAY_GROUPS.map((group) => {
      const days: readonly number[] = group.days;
      const match = availability.windows.find((window) => days.includes(window.dayOfWeek) && window.isEnabled);
      return [group.key, match ? { startTime: match.startTime.slice(0, 5), endTime: match.endTime.slice(0, 5), isEnabled: true } : { startTime: "17:00", endTime: "23:00", isEnabled: false }];
    }),
  );
}
