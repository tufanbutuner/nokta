import { Check, ChevronDown, Copy, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueImage } from "@/components/venues/VenueImage";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_CITY, getActiveCities } from "@/lib/cities";
import { getDayOpeningLabel, getLondonDayIndex } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { createRecommendShareCode, saveRecommendShortlist } from "@/services/recommendShortlistService";
import type { Venue, VenueVibe } from "@/types/venue";

type Slot = "people" | "day" | "area" | "vibe";
type VibeKey = "lively" | "chilled" | "special" | "outdoor" | "any";

const MAX_PICKS = 3;
const PAGE_SIZE = 12;
const PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const VIBES: Record<VibeKey, { phrase: string; vibes: VenueVibe[]; test: (venue: Venue) => boolean }> = {
  lively: { phrase: "somewhere lively", vibes: ["party", "late-night", "football", "groups"], test: (venue) => venue.vibes.some((vibe) => ["party", "late-night", "football", "groups"].includes(vibe)) },
  chilled: { phrase: "somewhere chilled", vibes: ["quiet", "casual"], test: (venue) => venue.vibes.some((vibe) => vibe === "quiet" || vibe === "casual") },
  special: { phrase: "somewhere special", vibes: ["luxury", "date-night", "rooftop"], test: (venue) => venue.vibes.some((vibe) => ["luxury", "date-night", "rooftop"].includes(vibe)) },
  outdoor: { phrase: "a spot outside", vibes: ["outdoor"], test: (venue) => venue.outdoor || venue.vibes.includes("outdoor") },
  any: { phrase: "anywhere good", vibes: [], test: () => true },
};

function dayPhrase(offset: number, todayIndex: number) {
  if (offset === 0) return "tonight";
  if (offset === 1) return "tomorrow night";
  return `${DAY_NAMES[(todayIndex + offset) % 7]} night`;
}

/**
 * "Plan a night": the brief is a sentence you edit, the shortlist is three dots
 * you fill, and the result is one link for the group chat. All state lives in
 * the URL so it survives the sign-in hop that sharing needs.
 */
export function PlanNightPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { venues, isLoading } = useVenues();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [isSending, setIsSending] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayIndex = getLondonDayIndex();
  const people = Number(searchParams.get("n")) || 6;
  const dayOffset = Math.min(6, Math.max(0, Number(searchParams.get("day")) || 0));
  const city = searchParams.get("city") || DEFAULT_CITY;
  const area = searchParams.get("area") || "any";
  const vibe = (searchParams.get("vibe") as VibeKey | null) ?? "lively";
  const vibeConfig = VIBES[vibe] ?? VIBES.lively;
  const picks = (searchParams.get("picks") ?? "").split(",").filter(Boolean).slice(0, MAX_PICKS);
  const dayIndex = (todayIndex + dayOffset) % 7;

  useEffect(() => {
    trackEvent("plan_viewed");
  }, []);

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
    setShareUrl(null);
  }

  function choose(slot: Slot, next: Record<string, string | null>) {
    update(next);
    setOpenSlot(null);
    setVisible(PAGE_SIZE);
    trackEvent("plan_slot_changed", { slot });
  }

  const cityVenues = useMemo(() => venues.filter((venue) => venue.city === city && venue.businessStatus !== "temporarily-closed"), [venues, city]);

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const venue of cityVenues) if (venue.area) counts.set(venue.area, (counts.get(venue.area) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([name]) => name);
  }, [cityVenues]);

  const cities = useMemo(() => {
    const present = new Set(venues.map((venue) => venue.city));
    return getActiveCities().filter((option) => present.has(option.name));
  }, [venues]);

  const { matches, isRelaxed } = useMemo(() => {
    const open = cityVenues
      .filter((venue) => area === "any" || venue.area === area)
      .map((venue) => ({ venue, hours: getDayOpeningLabel(venue, dayIndex) }))
      .filter((item) => item.hours !== "Closed");
    const byVibe = open.filter((item) => vibeConfig.test(item.venue));
    // Never leave the page empty over a vibe tag: fall back to everything open that night.
    const list = byVibe.length ? byVibe : open;
    const sorted = list.sort((a, b) => {
      if ((a.hours === null) !== (b.hours === null)) return a.hours === null ? 1 : -1;
      if (people >= 8) {
        const groupDelta = Number(b.venue.vibes.includes("groups")) - Number(a.venue.vibes.includes("groups"));
        if (groupDelta) return groupDelta;
      }
      return (b.venue.rating ?? 0) - (a.venue.rating ?? 0);
    });
    return { matches: sorted, isRelaxed: !byVibe.length && open.length > 0 };
  }, [cityVenues, area, dayIndex, vibeConfig, people]);

  const pickedVenues = picks.map((id) => venues.find((venue) => venue.id === id)).filter((venue): venue is Venue => Boolean(venue));

  function togglePick(venue: Venue) {
    const isPicked = picks.includes(venue.id);
    if (!isPicked && picks.length >= MAX_PICKS) return;
    const next = isPicked ? picks.filter((id) => id !== venue.id) : [...picks, venue.id];
    update({ picks: next.length ? next.join(",") : null });
    if (!isPicked) trackEvent("plan_venue_shortlisted", { venueId: venue.id, count: next.length });
  }

  const dayText = dayPhrase(dayOffset, todayIndex);
  const areaText = area === "any" ? `anywhere in ${city}` : `around ${area}`;

  async function send() {
    if (!pickedVenues.length) return;
    if (!user) {
      navigate(`/sign-in?redirect=${encodeURIComponent(`/plan?${searchParams.toString()}`)}`);
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const name = `${dayText.charAt(0).toUpperCase()}${dayText.slice(1)} · ${area === "any" ? city : area}`.slice(0, 80);
      const shortlist = await saveRecommendShortlist({
        userId: user.id,
        shortlist: {
          name,
          city,
          // The shortlist table allows at most three vibe tags.
          answers: { occasion: people >= 8 ? "big-group" : "small-group", vibes: vibeConfig.vibes.slice(0, 3), budget: null, distance: null },
          picks: pickedVenues.map((venue) => ({
            venueId: venue.id,
            role: "chosen",
            matchLabel: `For ${people}`,
            reason: [facts(venue), hoursLine(venue, dayIndex)].filter(Boolean).join(" · "),
          })),
        },
      });
      const code = await createRecommendShareCode({ userId: user.id, shortlistId: shortlist.id });
      setShareUrl(`${window.location.origin}/s/${code}`);
      trackEvent("plan_shared", { count: pickedVenues.length, people, city });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not make the link. Try again.");
    } finally {
      setIsSending(false);
    }
  }

  const shareText = shareUrl ? `${dayText.charAt(0).toUpperCase()}${dayText.slice(1)}, ${areaText}. Which one? ${shareUrl}` : "";

  async function nativeShare() {
    if (!shareUrl) return;
    try {
      await navigator.share({ title: "Our shortlist", text: shareText });
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto w-full max-w-[960px] px-[18px] pb-40 pt-6 sm:px-6 sm:pt-10">
      <PageMeta title="Plan a night | nokta" description="Planning for a group? Pick up to three places and send one link to the group chat." canonicalPath="/plan" />

      <section className="max-w-[680px]">
        <h1 className="text-[30px] font-bold leading-[1.08] tracking-[-0.02em] text-nokta-ink sm:text-[40px]">Sort the group chat.</h1>
        <p className="mt-3 text-[22px] font-medium leading-[1.5] tracking-[-0.01em] text-nokta-ink-muted [text-wrap:pretty] sm:text-[26px]">
          <SlotButton slot="people" openSlot={openSlot} onToggle={setOpenSlot}>{people} of us</SlotButton>,{" "}
          <SlotButton slot="day" openSlot={openSlot} onToggle={setOpenSlot}>{dayText}</SlotButton>,{" "}
          <SlotButton slot="area" openSlot={openSlot} onToggle={setOpenSlot}>{areaText}</SlotButton>, and we want{" "}
          <SlotButton slot="vibe" openSlot={openSlot} onToggle={setOpenSlot}>{vibeConfig.phrase}</SlotButton>.
        </p>

        {openSlot ? (
          <div id={`plan-slot-${openSlot}`} className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Choose ${openSlot}`}>
            {openSlot === "people" && PEOPLE_OPTIONS.map((value) => (
              <OptionChip key={value} isActive={value === people} onClick={() => choose("people", { n: String(value) })}>{value === 20 ? "20+" : value}</OptionChip>
            ))}
            {openSlot === "day" && Array.from({ length: 7 }, (_, offset) => (
              <OptionChip key={offset} isActive={offset === dayOffset} onClick={() => choose("day", { day: offset ? String(offset) : null })}>
                {offset === 0 ? "Tonight" : offset === 1 ? "Tomorrow" : DAY_NAMES[(todayIndex + offset) % 7]}
              </OptionChip>
            ))}
            {openSlot === "area" && (
              <>
                <OptionChip isActive={area === "any"} onClick={() => choose("area", { area: null })}>Anywhere in {city}</OptionChip>
                {areas.map((name) => <OptionChip key={name} isActive={name === area} onClick={() => choose("area", { area: name })}>{name}</OptionChip>)}
                {cities.length > 1 ? (
                  <label className="inline-flex items-center gap-2 rounded-full border border-dashed border-nokta-border px-3 py-1.5 text-[13.5px] text-nokta-ink-muted">
                    Another city
                    <span className="relative">
                      <select value={city} onChange={(event) => choose("area", { city: event.target.value === DEFAULT_CITY ? null : event.target.value, area: null, picks: null })} className="cursor-pointer appearance-none bg-transparent pr-5 font-medium text-nokta-ink outline-none">
                        {cities.map((option) => <option key={option.slug} value={option.name}>{option.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nokta-ink-muted" aria-hidden="true" />
                    </span>
                  </label>
                ) : null}
              </>
            )}
            {openSlot === "vibe" && (Object.keys(VIBES) as VibeKey[]).map((key) => (
              <OptionChip key={key} isActive={key === vibe} onClick={() => choose("vibe", { vibe: key === "lively" ? null : key })}>{VIBES[key].phrase}</OptionChip>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-[13px] text-nokta-ink-muted">Pick up to three. We'll make one link to send the group.</p>
      </section>

      {isRelaxed ? (
        <p className="mt-6 rounded-xl border border-nokta-border bg-white px-4 py-3 text-[13.5px] text-nokta-ink-subtle">
          Nothing tagged {vibeConfig.phrase.replace(/^(somewhere|a spot|anywhere) /, "")} {areaText} yet, so here's everything open {dayText}.
        </p>
      ) : null}

      <section aria-label="Places" className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-6 sm:grid-cols-2">
        {isLoading ? (
          [0, 1].map((key) => <Skeleton key={key} className="mb-6 h-[280px] rounded-xl" />)
        ) : !matches.length ? (
          <div className="py-6 sm:col-span-2">
            <p className="text-[15px] text-nokta-ink">Nothing open {areaText} {dayText}.</p>
            <button type="button" onClick={() => choose("area", { area: null })} className="mt-2 text-[14px] font-semibold text-clay-accent hover:underline">Look across {city}</button>
          </div>
        ) : (
          matches.slice(0, visible).map(({ venue, hours }) => (
            <PlanVenue key={venue.id} venue={venue} hours={hours} dayName={dayOffset === 0 ? "Tonight" : DAY_NAMES[dayIndex]} isPicked={picks.includes(venue.id)} isFull={picks.length >= MAX_PICKS} onToggle={() => togglePick(venue)} />
          ))
        )}
      </section>

      {matches.length > visible ? (
        <button type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)} className="mt-2 h-11 rounded-xl border border-nokta-border px-5 text-[14px] font-semibold text-nokta-ink hover:border-nokta-ink/40">
          Show more
        </button>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-nokta-border p-4">
        <div>
          <p className="text-[15px] font-semibold text-nokta-ink">Can't decide?</p>
          <p className="text-[13px] text-nokta-ink-muted">Answer four questions and we'll pick three.</p>
        </div>
        <Link to="/recommend" className="inline-flex h-10 shrink-0 items-center rounded-xl border border-nokta-border px-4 text-[14px] font-semibold text-nokta-ink hover:border-nokta-ink/40">
          Pick for us
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-3.5 z-30 mx-auto w-full max-w-[520px] px-3.5" aria-live="polite">
        <div className="rounded-[18px] bg-nokta-ink px-4 py-3 text-white shadow-[0_14px_30px_-14px_rgba(42,33,27,0.6)]">
          {shareUrl ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] font-semibold">Link ready. Send it to the group.</p>
              <div className="flex gap-2">
                {"share" in navigator ? (
                  <TrayButton onClick={nativeShare} label="Share"><Share2 className="h-4 w-4" /></TrayButton>
                ) : null}
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-[14px] font-semibold text-nokta-ink">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <TrayButton onClick={copy} label={copied ? "Copied" : "Copy link"}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</TrayButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex gap-[7px]" aria-hidden="true">
                  {Array.from({ length: MAX_PICKS }, (_, index) => (
                    <span key={index} className={cn("h-3 w-3 rounded-full border-[1.5px] transition-colors duration-300", index < pickedVenues.length ? "border-clay-accent bg-clay-accent" : "border-white/45")} />
                  ))}
                </div>
                <p className="mt-1.5 text-[12.5px] text-white/70">
                  {error ?? (pickedVenues.length ? `${pickedVenues.length} of ${MAX_PICKS} picked` : "Pick your first spot")}
                </p>
              </div>
              <button
                type="button"
                onClick={send}
                disabled={!pickedVenues.length || isSending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-nokta-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Share2 className="h-4 w-4" />
                {isSending ? "Making link…" : user ? "Send to group" : "Sign in to send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function facts(venue: Venue) {
  return [venue.priceFrom ? `From £${venue.priceFrom}` : "£".repeat(venue.priceLevel), venue.food ? "Food" : null, venue.halal ? "Halal" : null].filter(Boolean).join(" · ");
}

function hoursLine(venue: Venue, dayIndex: number) {
  const hours = getDayOpeningLabel(venue, dayIndex);
  return hours ? `${DAY_NAMES[dayIndex].slice(0, 3)} ${hours}` : null;
}

function SlotButton({ slot, openSlot, onToggle, children }: { slot: Slot; openSlot: Slot | null; onToggle: (slot: Slot | null) => void; children: React.ReactNode }) {
  const isOpen = openSlot === slot;
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={isOpen ? `plan-slot-${slot}` : undefined}
      onClick={() => onToggle(isOpen ? null : slot)}
      className={cn("border-b-2 px-px font-semibold text-nokta-ink transition-colors", isOpen ? "border-clay-accent text-clay-accent" : "border-nokta-ink hover:border-clay-accent")}
    >
      {children}
    </button>
  );
}

function OptionChip({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn("rounded-full border px-[13px] py-2 text-[13.5px] font-medium transition-colors", isActive ? "border-nokta-ink bg-nokta-ink text-white" : "border-nokta-border bg-white text-nokta-ink hover:border-nokta-ink/40")}
    >
      {children}
    </button>
  );
}

function TrayButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-[14px] font-semibold text-nokta-ink">
      {children} {label}
    </button>
  );
}

function PlanVenue({ venue, hours, dayName, isPicked, isFull, onToggle }: { venue: Venue; hours: string | null; dayName: string; isPicked: boolean; isFull: boolean; onToggle: () => void }) {
  return (
    <article className="min-w-0 border-t border-nokta-divider py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
      <Link to={`/venues/${venue.slug}`} className="block overflow-hidden rounded-xl">
        <VenueImage venue={venue} alt={`${venue.name}`} className="h-[180px] w-full object-cover" monogramClassName="h-[180px]" />
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <Link to={`/venues/${venue.slug}`} className="block min-w-0 flex-1" title={venue.name}>
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-nokta-ink">{venue.name}</h2>
          <p className="truncate text-[13px] text-nokta-ink-muted">{venue.area}</p>
        </Link>
        <button
          type="button"
          aria-pressed={isPicked}
          disabled={!isPicked && isFull}
          onClick={onToggle}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-[7px] rounded-full border px-3 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            isPicked ? "border-clay-accent text-clay-accent" : "border-nokta-border text-nokta-ink hover:border-nokta-ink/40",
          )}
        >
          <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full border-[1.5px]", isPicked ? "border-clay-accent bg-clay-accent" : "border-nokta-ink-muted")} />
          {isPicked ? "Shortlisted" : "Shortlist"}
        </button>
      </div>
      <p className="mt-2 text-[13px] text-nokta-ink-subtle">{facts(venue)}</p>
      <p className="mt-1 text-[13px] text-nokta-ink-muted">
        {hours ? `${dayName} ${hours}` : "Hours not listed"}
        {venue.vibes.includes("groups") ? " · Good for groups" : ""}
      </p>
    </article>
  );
}
