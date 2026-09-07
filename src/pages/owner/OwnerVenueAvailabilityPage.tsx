import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { formatBookingWindowLabel, formatDayOfWeek, formatNoticePeriod } from "@/lib/bookingAvailabilityLabels";
import { createOwnerVenueBookingBlackoutDate, deleteOwnerVenueBookingBlackoutDate, deleteOwnerVenueBookingWindow, getOwnerVenueBookingAvailability, replaceOwnerVenueBookingWindows, updateOwnerVenueBookingSettings, upsertOwnerVenueBookingWindow } from "@/services/ownerBookingAvailabilityService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueBookingAvailability, VenueBookingBlackoutDate, VenueBookingSettings, VenueBookingWindow } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export function OwnerVenueAvailabilityPage() {
  const { venueId = "" } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<Partial<VenueBookingSettings>>({});
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [windowsMessage, setWindowsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      getMyClaimedVenue({ userId: user.id, venueId }),
      getOwnerVenueBookingAvailability({ ownerUserId: user.id, venueId }),
    ])
      .then(([nextVenue, nextAvailability]) => {
        if (cancelled) return;
        setVenue(nextVenue);
        setAvailability(nextAvailability);
        setSettingsDraft(nextAvailability.settings);
        trackEvent("owner_availability_viewed", { venueId });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load availability settings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, venueId]);

  const windowsByDay = useMemo(() => {
    const grouped = new Map<number, VenueBookingWindow[]>();
    availability?.windows.forEach((window) => grouped.set(window.dayOfWeek, [...(grouped.get(window.dayOfWeek) ?? []), window]));
    return grouped;
  }, [availability]);

  async function saveSettings() {
    if (!user || !availability) return;
    setIsSaving(true);
    setError(null);
    try {
      const settings = await updateOwnerVenueBookingSettings({ ownerUserId: user.id, venueId, settings: settingsDraft });
      setAvailability({ ...availability, settings });
      setSettingsDraft(settings);
      setMessage("Availability settings saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveWindow(window: Partial<VenueBookingWindow>) {
    if (!user || !availability) return;
    setError(null);
    setWindowsMessage(null);
    try {
      const saved = await upsertOwnerVenueBookingWindow({ ownerUserId: user.id, venueId, window });
      setAvailability({
        ...availability,
        windows: [...availability.windows.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
      });
      setWindowsMessage("Booking window saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save booking window.");
    }
  }

  async function deleteWindow(windowId: string) {
    if (!user || !availability) return;
    setError(null);
    setWindowsMessage(null);
    try {
      await deleteOwnerVenueBookingWindow({ ownerUserId: user.id, venueId, windowId });
      setAvailability({ ...availability, windows: availability.windows.filter((window) => window.id !== windowId) });
      setWindowsMessage("Booking window removed.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not remove booking window.");
    }
  }

  async function addBlackoutDate() {
    if (!user || !availability || !blackoutDate) return;
    const saved = await createOwnerVenueBookingBlackoutDate({ ownerUserId: user.id, venueId, blackoutDate: { blackoutDate, reason: blackoutReason, isFullDay: true } });
    setAvailability({ ...availability, blackoutDates: [...availability.blackoutDates, saved].sort((a, b) => a.blackoutDate.localeCompare(b.blackoutDate)) });
    setBlackoutDate("");
    setBlackoutReason("");
  }

  async function useOpeningHoursPreset() {
    if (!user || !availability || !venue) return;
    const windows = buildWindowsFromOpeningHours(venue);
    if (!windows.length) {
      setWindowsMessage(null);
      setError("This venue does not have usable opening hours yet.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setWindowsMessage(null);
    try {
      const savedWindows = await replaceOwnerVenueBookingWindows({ ownerUserId: user.id, venueId, windows });
      setAvailability({ ...availability, windows: savedWindows });
      setWindowsMessage(`Added ${savedWindows.length} booking window${savedWindows.length === 1 ? "" : "s"} from opening hours.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not apply opening hours.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBlackoutDate(blackout: VenueBookingBlackoutDate) {
    if (!user || !availability) return;
    await deleteOwnerVenueBookingBlackoutDate({ ownerUserId: user.id, venueId, blackoutDateId: blackout.id });
    setAvailability({ ...availability, blackoutDates: availability.blackoutDates.filter((item) => item.id !== blackout.id) });
  }

  if (isLoading) return <OwnerLayout><LoadingState message="Loading availability..." /></OwnerLayout>;
  if (error && !availability) return <OwnerLayout><ErrorState message={error} /></OwnerLayout>;
  if (!availability || !venue) return <OwnerLayout><ErrorState title="Availability not found" message="You do not have access to this venue." /></OwnerLayout>;

  return (
    <OwnerLayout>
      <PageMeta title={`Hours & bookings | ${venue.name}`} description="Manage venue booking availability settings." canonicalPath={`/owner/venues/${venue.slug}/bookings`} />
      <OwnerVenueTabShell venue={venue} title="Hours & bookings">
      <div className="space-y-5">
        <p className="text-[13px] text-muted-foreground">Configure when customers can request bookings. The calendar and unified request log arrive in Phase 5.</p>
        {message ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">{message}</Alert> : null}
        {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
        <AvailabilityPreview settings={availability.settings} windowsCount={availability.windows.filter((window) => window.isEnabled).length} blackoutCount={availability.blackoutDates.length} />
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">Booking rules</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={settingsDraft.bookingRequestsEnabled ?? false} onChange={(event) => setSettingsDraft({ ...settingsDraft, bookingRequestsEnabled: event.target.checked })} /> Booking requests enabled</label>
            <Field label="Minimum party size"><Input type="number" value={settingsDraft.minPartySize ?? 1} onChange={(event) => setSettingsDraft({ ...settingsDraft, minPartySize: Number(event.target.value) })} /></Field>
            <Field label="Maximum party size"><Input type="number" value={settingsDraft.maxPartySize ?? 20} onChange={(event) => setSettingsDraft({ ...settingsDraft, maxPartySize: Number(event.target.value) })} /></Field>
            <Field label="Minimum notice minutes"><Input type="number" value={settingsDraft.minNoticeMinutes ?? 120} onChange={(event) => setSettingsDraft({ ...settingsDraft, minNoticeMinutes: Number(event.target.value) })} /></Field>
            <Field label="Max advance days"><Input type="number" value={settingsDraft.maxAdvanceDays ?? 30} onChange={(event) => setSettingsDraft({ ...settingsDraft, maxAdvanceDays: Number(event.target.value) })} /></Field>
            <Field label="Default duration minutes"><Input type="number" value={settingsDraft.defaultBookingDurationMinutes ?? 120} onChange={(event) => setSettingsDraft({ ...settingsDraft, defaultBookingDurationMinutes: Number(event.target.value) })} /></Field>
            <Field label="Booking instructions"><Textarea value={settingsDraft.bookingInstructions ?? ""} onChange={(event) => setSettingsDraft({ ...settingsDraft, bookingInstructions: event.target.value })} /></Field>
            <Field label="Internal notes"><Textarea value={settingsDraft.internalNotes ?? ""} onChange={(event) => setSettingsDraft({ ...settingsDraft, internalNotes: event.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={saveSettings} disabled={isSaving}>{isSaving ? "Saving..." : "Save settings"}</Button>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Weekly booking windows</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Set the days and times customers can request bookings. Use opening hours as a starting point, then adjust any day that needs tighter booking slots.</p>
              {windowsMessage ? <p className="mt-2 text-sm font-medium text-emerald-700">{windowsMessage}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Button type="button" variant="outline" onClick={useOpeningHoursPreset} disabled={isSaving}>
                {isSaving ? "Applying..." : "Use opening hours"}
              </Button>
              {!venue.openingHours.length ? <span className="text-xs text-muted-foreground">No opening hours saved yet</span> : null}
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            {DAYS.map((day) => <DayWindows key={day} day={day} windows={windowsByDay.get(day) ?? []} onSave={saveWindow} onDelete={deleteWindow} />)}
          </div>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">Blackout dates</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
            <Input type="date" value={blackoutDate} onChange={(event) => setBlackoutDate(event.target.value)} />
            <Input placeholder="Reason, e.g. private event" value={blackoutReason} onChange={(event) => setBlackoutReason(event.target.value)} />
            <Button onClick={addBlackoutDate} disabled={!blackoutDate}>Add blackout</Button>
          </div>
          <div className="mt-4 grid gap-2">
            {availability.blackoutDates.length ? availability.blackoutDates.map((blackout) => <div key={blackout.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span>{blackout.blackoutDate} • {blackout.reason ?? "No reason"}</span><Button variant="ghost" size="sm" onClick={() => deleteBlackoutDate(blackout)}>Delete</Button></div>) : <p className="text-sm text-muted-foreground">No blackout dates yet.</p>}
          </div>
        </section>
      </div>
      </OwnerVenueTabShell>
    </OwnerLayout>
  );
}

function AvailabilityPreview({ settings, windowsCount, blackoutCount }: { settings: VenueBookingSettings; windowsCount: number; blackoutCount: number }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Requests" value={settings.bookingRequestsEnabled ? "Enabled" : "Paused"} /><Metric label="Party size" value={`${settings.minPartySize}-${settings.maxPartySize}`} /><Metric label="Notice" value={formatNoticePeriod(settings.minNoticeMinutes)} /><Metric label="Windows" value={String(windowsCount)} /><Metric label="Blackouts" value={String(blackoutCount)} /></section>;
}

function DayWindows({ day, windows, onSave, onDelete }: { day: number; windows: VenueBookingWindow[]; onSave: (window: Partial<VenueBookingWindow>) => void; onDelete: (windowId: string) => void }) {
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("23:30");
  const sortedWindows = [...windows].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="rounded-xl border border-border/80 bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)] lg:items-start">
        <div>
          <h3 className="font-semibold text-foreground">{formatDayOfWeek(day)}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{sortedWindows.filter((window) => window.isEnabled).length || "No"} active window{sortedWindows.filter((window) => window.isEnabled).length === 1 ? "" : "s"}</p>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[130px_130px_auto]">
            <Input aria-label={`${formatDayOfWeek(day)} start time`} type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            <Input aria-label={`${formatDayOfWeek(day)} end time`} type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            <Button type="button" variant="outline" onClick={() => onSave({ dayOfWeek: day, startTime, endTime, isEnabled: true })}>
              Add window
            </Button>
          </div>
          <div className="grid gap-2">
            {sortedWindows.length ? (
              sortedWindows.map((window) => (
                <div key={window.id} className="flex flex-col gap-2 rounded-lg bg-secondary/70 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-foreground">
                    {formatBookingWindowLabel(window)}
                    {window.isEnabled ? null : <span className="ml-2 text-muted-foreground">Disabled</span>}
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => onSave({ ...window, isEnabled: !window.isEnabled })}>
                      {window.isEnabled ? "Disable" : "Enable"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(window.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">No booking windows for this day.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function buildWindowsFromOpeningHours(venue: Venue): Partial<VenueBookingWindow>[] {
  return venue.openingHours.flatMap((item) => {
    const dayOfWeek = parseOpeningHoursDay(item.day);
    const startTime = normaliseOpeningHoursTime(item.open);
    const endTime = normaliseOpeningHoursTime(item.close);
    if (dayOfWeek === null || !startTime || !endTime || startTime === endTime) return [];
    if (endTime > startTime) return [{ dayOfWeek, startTime, endTime, isEnabled: true }];
    if (endTime === "00:00") return [{ dayOfWeek, startTime, endTime: "23:59", isEnabled: true }];
    return [
      { dayOfWeek, startTime, endTime: "23:59", isEnabled: true },
      { dayOfWeek: (dayOfWeek + 1) % 7, startTime: "00:00", endTime, isEnabled: true },
    ];
  });
}

function parseOpeningHoursDay(day: string): number | null {
  const normalised = day.trim().toLowerCase();
  const index = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex((value) => normalised.startsWith(value.slice(0, 3)));
  return index >= 0 ? index : null;
}

function normaliseOpeningHoursTime(value: string): string | null {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
