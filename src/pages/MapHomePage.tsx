import { ChevronDown, LocateFixed, Search } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { NoktaMapPoint } from "@/components/map/NoktaMap";
import { PageMeta } from "@/components/seo/PageMeta";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueImage } from "@/components/venues/VenueImage";
import { brandConfig } from "@/config/brand";
import { useAppLocation } from "@/context/AppLocationContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_CITY, getActiveCities, getCityByName } from "@/lib/cities";
import { calculateDistanceMiles, formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueOpeningBoundary } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import type { Venue } from "@/types/venue";

// MapLibre is most of this page's weight; the venue sheet renders while it streams in.
const NoktaMap = lazy(async () => ({ default: (await import("@/components/map/NoktaMap")).NoktaMap }));

type FilterKey = "openNow" | "under25" | "groups" | "outdoor" | "late";

const FILTERS: { key: FilterKey; label: string; test: (venue: Venue, isOpen: boolean) => boolean }[] = [
  { key: "openNow", label: "Open now", test: (_venue, isOpen) => isOpen },
  { key: "under25", label: "Under £25", test: (venue) => venue.priceFrom != null && venue.priceFrom <= 25 },
  { key: "groups", label: "Groups", test: (venue) => venue.vibes.includes("groups") },
  { key: "outdoor", label: "Outdoor", test: (venue) => venue.outdoor || venue.vibes.includes("outdoor") },
  { key: "late", label: "Late", test: (venue) => venue.openLate || venue.vibes.includes("late-night") },
];

/** Cards in the swipe row; the expanded list shows the rest. */
const PEEK_CARD_LIMIT = 24;
const LIST_LIMIT = 80;
/** Collapsed sheet sized to its content (handle, heading, chips, card row, Discover link). */
const PEEK_HEIGHT = 296;

interface MapVenue {
  venue: Venue;
  isOpen: boolean;
  /** "Open till 02:00" / "Opens 18:00" / null. */
  boundary: string | null;
  miles: number | null;
}

/**
 * Homepage as a map: every venue is a dot. A bottom sheet (a side panel on
 * desktop) carries the honest detail: price, closing time, distance.
 */
export function MapHomePage() {
  const navigate = useNavigate();
  const { venues, isLoading } = useVenues();
  const { userLocation, locationStatus, useCurrentLocation } = useAppLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<FilterKey>>(() => new Set(["openNow"]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [focus, setFocus] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null);
  const [wantsLocation, setWantsLocation] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const scrollingFromMapRef = useRef(false);

  useEffect(() => {
    trackEvent("map_home_viewed");
    // The page never scrolls; the site-wide reserved scrollbar gutter would leave a dead strip beside the map.
    const { style } = document.documentElement;
    const previous = { overflowY: style.overflowY, scrollbarGutter: style.scrollbarGutter };
    style.overflowY = "hidden";
    style.scrollbarGutter = "auto";
    return () => {
      style.overflowY = previous.overflowY;
      style.scrollbarGutter = previous.scrollbarGutter;
    };
  }, []);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const venue of venues) counts.set(venue.city, (counts.get(venue.city) ?? 0) + 1);
    return getActiveCities().filter((option) => counts.has(option.name));
  }, [venues]);
  const cityConfig = getCityByName(city) ?? getActiveCities()[0];

  const cityVenues: MapVenue[] = useMemo(() => {
    const now = new Date();
    return venues
      .filter((venue) => venue.city === city && Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude))
      .map((venue) => {
        const boundary = getVenueOpeningBoundary(venue, now);
        return {
          venue,
          isOpen: boundary.status === "open",
          boundary: boundary.label,
          miles: userLocation ? getVenueDistanceMiles(venue, userLocation) : null,
        };
      });
  }, [venues, city, userLocation]);

  // Every filter except "Open now" shapes the map, so closed venues stay as muted dots;
  // "Open now" narrows only the list and the count.
  const mapVenues = useMemo(() => {
    const centre = userLocation ?? { latitude: cityConfig.latitude, longitude: cityConfig.longitude };
    const filtered = cityVenues.filter((item) => FILTERS.every((filter) => filter.key === "openNow" || !active.has(filter.key) || filter.test(item.venue, item.isOpen)));
    // Nearest first, from the visitor or else the city centre, so the first card sits in the opening view.
    // Within each half-mile band, venues with real photos lead.
    return filtered
      .map((item) => ({ item, distance: calculateDistanceMiles(centre, item.venue), hasPhoto: item.venue.images.length > 0 }))
      .sort((a, b) => Math.floor(a.distance * 2) - Math.floor(b.distance * 2) || Number(b.hasPhoto) - Number(a.hasPhoto) || a.distance - b.distance)
      .map(({ item }) => item);
  }, [cityVenues, active, userLocation, cityConfig.latitude, cityConfig.longitude]);

  const results = useMemo(() => (active.has("openNow") ? mapVenues.filter((item) => item.isOpen) : mapVenues), [mapVenues, active]);

  const points: NoktaMapPoint[] = useMemo(
    () => mapVenues.map(({ venue, isOpen, boundary }) => ({
      id: venue.id,
      latitude: venue.latitude,
      longitude: venue.longitude,
      isOpen,
      label: [venue.name, venue.priceFrom ? `£${venue.priceFrom}` : "£".repeat(venue.priceLevel), boundary?.replace("Open till", "till")].filter(Boolean).join(" · "),
    })),
    [mapVenues],
  );

  // Keep a selection on phones so the clay dot always marks the card in view;
  // drop one the filters have removed.
  useEffect(() => {
    if (selectedId && mapVenues.some((item) => item.venue.id === selectedId)) return;
    setSelectedId(!isDesktop && results.length ? results[0].venue.id : null);
  }, [results, mapVenues, selectedId, isDesktop]);

  // A new result set starts the card row from its first card.
  useEffect(() => {
    cardsRef.current?.scrollTo({ left: 0 });
  }, [results]);

  // Once the browser hands over a position, fly there.
  useEffect(() => {
    if (!wantsLocation || !userLocation) return;
    setWantsLocation(false);
    setFocus({ latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 14 });
  }, [wantsLocation, userLocation]);

  function changeCity(next: string) {
    setCity(next);
    setSelectedId(null);
    const config = getCityByName(next);
    if (config) setFocus({ latitude: config.latitude, longitude: config.longitude, zoom: config.defaultZoom + 1 });
  }

  function toggleFilter(key: FilterKey) {
    setActive((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      trackEvent("map_home_filter_toggled", { filter: key, enabled: next.has(key) });
      return next;
    });
  }

  function locate() {
    trackEvent("map_home_locate_clicked");
    if (userLocation) {
      setFocus({ latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 14 });
      return;
    }
    setWantsLocation(true);
    useCurrentLocation();
  }

  function selectFromMap(id: string) {
    setSelectedId(id);
    trackEvent("map_home_venue_selected", { venueId: id, source: "map" });
    const card = cardsRef.current?.querySelector<HTMLElement>(`[data-venue="${id}"]`);
    if (card) {
      scrollingFromMapRef.current = true;
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      window.setTimeout(() => (scrollingFromMapRef.current = false), 600);
    }
  }

  // Swiping the card row moves the clay dot to whichever card is centred.
  function handleCardScroll() {
    const row = cardsRef.current;
    if (!row || isDesktop || scrollingFromMapRef.current) return;
    const middle = row.scrollLeft + row.clientWidth / 2;
    let closest: string | null = null;
    let closestDistance = Infinity;
    for (const card of row.querySelectorAll<HTMLElement>("[data-venue]")) {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = card.dataset.venue ?? null;
      }
    }
    if (closest && closest !== selectedId) setSelectedId(closest);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city !== DEFAULT_CITY) params.set("city", city);
    navigate(`/discover${params.size ? `?${params}` : ""}`);
  }

  const openCount = cityVenues.filter((item) => item.isOpen).length;
  const discoverParams = new URLSearchParams();
  if (city !== DEFAULT_CITY) discoverParams.set("city", city);
  if (active.has("openNow")) discoverParams.set("status", "open");
  const discoverPath = `/discover${discoverParams.size ? `?${discoverParams}` : ""}`;
  const heading = active.has("openNow")
    ? `${results.length} open ${userLocation ? "near you" : `in ${city}`}`
    : `${results.length} ${results.length === 1 ? "place" : "places"} ${userLocation ? "near you" : `in ${city}`}`;
  const sheetPadding = isDesktop
    ? { top: 96, bottom: 40, left: 40, right: 40 }
    : { top: 130, bottom: isExpanded ? 80 : PEEK_HEIGHT, left: 30, right: 30 };

  return (
    <main className="relative h-[calc(100dvh-65px)] overflow-hidden bg-[#f7f1e8] lg:grid lg:grid-cols-[440px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <PageMeta
        title={`${brandConfig.appName} - Discover Social Venues Across the UK`}
        description="See what's open near you on one map: shisha lounges and social venues with real prices, opening hours and photos. Request bookings direct."
        canonicalPath="/"
      />

      <div className="absolute inset-0 lg:relative lg:col-start-2 lg:row-start-1">
        <Suspense fallback={null}>
          <NoktaMap
            points={points}
            selectedId={selectedId}
            onSelect={selectFromMap}
            center={[cityConfig.longitude, cityConfig.latitude]}
            zoom={cityConfig.defaultZoom + 1}
            focus={focus}
            userLocation={userLocation}
            padding={sheetPadding}
          />
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 top-0 grid gap-2.5 p-3.5 sm:p-5">
          <form onSubmit={handleSearch} className="pointer-events-auto flex h-[50px] items-center gap-2.5 rounded-[14px] border border-nokta-border bg-white/95 pl-3.5 pr-1.5 shadow-[0_6px_18px_-10px_rgba(42,33,27,0.35)] backdrop-blur lg:max-w-[460px]">
            <Search className="h-[18px] w-[18px] shrink-0 text-nokta-ink-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search places or areas"
              aria-label="Search places or areas"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-nokta-ink outline-none placeholder:text-nokta-ink-muted"
            />
            <label className="sr-only" htmlFor="map-home-city">City</label>
            <span className="relative shrink-0">
              <select
                id="map-home-city"
                value={city}
                onChange={(event) => changeCity(event.target.value)}
                className="h-[38px] max-w-[150px] cursor-pointer appearance-none rounded-full border border-nokta-border bg-white pl-3 pr-8 text-[13.5px] font-medium text-nokta-ink outline-none [field-sizing:content] focus-visible:ring-2 focus-visible:ring-clay-accent"
              >
                {(cities.length ? cities : [cityConfig]).map((option) => <option key={option.slug} value={option.name}>{option.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nokta-ink-muted" aria-hidden="true" />
            </span>
          </form>
        </div>

        <button
          type="button"
          onClick={locate}
          aria-label="Show venues near me"
          className={cn(
            "absolute right-3.5 z-10 grid h-11 w-11 place-items-center rounded-full border border-nokta-border bg-white text-nokta-ink shadow-[0_6px_14px_-8px_rgba(42,33,27,0.45)] transition-[bottom] duration-300 ease-out sm:right-5",
            isDesktop ? "bottom-8" : isExpanded ? "hidden" : "bottom-[310px]",
          )}
        >
          <LocateFixed className={cn("h-[18px] w-[18px]", locationStatus === "loading" && "animate-pulse text-clay-accent")} />
        </button>
        {locationStatus === "denied" ? (
          <p role="status" className="absolute inset-x-3.5 top-[76px] rounded-xl bg-nokta-ink px-3.5 py-2.5 text-[13px] text-white sm:inset-x-5 lg:max-w-[460px]">
            Location is blocked in your browser settings. Pick a city instead.
          </p>
        ) : null}
      </div>

      <section
        aria-label="Venues"
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[20px] bg-white shadow-[0_-10px_30px_-14px_rgba(42,33,27,0.35)] transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:col-start-1 lg:row-start-1 lg:h-full lg:rounded-none lg:border-r lg:border-nokta-border lg:shadow-none",
          isExpanded ? "h-[88%]" : "h-[296px]",
        )}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-label={isExpanded ? "Show the map" : "Show the full list"}
          aria-expanded={isExpanded}
          className="grid w-full shrink-0 place-items-center pb-1 pt-2.5 lg:hidden"
        >
          <span className="h-1 w-[38px] rounded-full bg-nokta-border" />
        </button>

        <div className="flex shrink-0 items-baseline justify-between gap-3 px-[18px] pb-2.5 pt-1 lg:pt-6">
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-nokta-ink lg:text-[22px]" aria-live="polite">
            {isLoading ? "Finding places…" : heading}
          </h1>
          <button type="button" onClick={() => setIsExpanded((value) => !value)} className="text-[13px] font-semibold text-nokta-ink lg:hidden">
            {isExpanded ? "Map" : "List"}
          </button>
        </div>

        <div className="flex shrink-0 snap-x gap-2 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none] [scroll-padding-inline:18px] lg:flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={active.has(filter.key)}
              onClick={() => toggleFilter(filter.key)}
              className={cn(
                "shrink-0 snap-start whitespace-nowrap rounded-full border px-[13px] py-2 text-[13.5px] font-medium transition-colors lg:px-3 lg:text-[13px]",
                active.has(filter.key) ? "border-nokta-ink bg-nokta-ink text-white" : "border-nokta-border bg-white text-nokta-ink hover:border-nokta-ink/40",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-hidden px-[18px] py-3">
            {[0, 1].map((key) => <Skeleton key={key} className="h-[108px] w-[74%] shrink-0 rounded-[14px]" />)}
          </div>
        ) : !results.length ? (
          <div className="px-[18px] py-4">
            <p className="text-[14px] text-nokta-ink">
              {active.has("openNow") && openCount === 0 ? `Nothing in ${city} is open right now.` : "Nothing matches those filters."}
            </p>
            <button type="button" onClick={() => setActive(new Set())} className="mt-2 text-[13.5px] font-semibold text-clay-accent hover:underline">
              Show every place
            </button>
          </div>
        ) : isExpanded || isDesktop ? (
          <ul className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-8 pt-2">
            {results.slice(0, LIST_LIMIT).map((item) => (
              <li key={item.venue.id}>
                <VenueRow item={item} isSelected={item.venue.id === selectedId} onHover={() => isDesktop && setSelectedId(item.venue.id)} />
              </li>
            ))}
            {results.length > LIST_LIMIT ? (
              <li className="pt-4">
                <Link to={discoverPath} className="text-[14px] font-semibold text-nokta-ink underline underline-offset-4">
                  See all {results.length} on Discover
                </Link>
              </li>
            ) : null}
          </ul>
        ) : (
          <>
            <div ref={cardsRef} onScroll={handleCardScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 pt-3 [scrollbar-width:none]">
              {results.slice(0, PEEK_CARD_LIMIT).map((item) => (
                <VenueCard key={item.venue.id} item={item} isSelected={item.venue.id === selectedId} />
              ))}
            </div>
            <Link to={discoverPath} className="mx-[18px] flex h-11 items-center justify-between border-t border-nokta-divider text-[14px] font-semibold text-nokta-ink">
              See all {results.length} on Discover
              <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

function facts(venue: Venue) {
  return [venue.priceFrom ? `From £${venue.priceFrom}` : "£".repeat(venue.priceLevel), venue.food ? "Food" : null, venue.halal ? "Halal" : null].filter(Boolean).join(" · ");
}

function where(item: MapVenue) {
  return [item.venue.area, item.miles !== null ? formatDistanceMiles(item.miles) : null].filter(Boolean).join(" · ");
}

function StatusLine({ item }: { item: MapVenue }) {
  if (!item.boundary) return null;
  return (
    <p className={cn("mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium", item.isOpen ? "text-forest-400" : "text-nokta-ink-muted")}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {item.boundary}
    </p>
  );
}

function VenueCard({ item, isSelected }: { item: MapVenue; isSelected: boolean }) {
  return (
    <Link
      to={`/venues/${item.venue.slug}`}
      data-venue={item.venue.id}
      className={cn(
        "grid w-[78%] max-w-[330px] shrink-0 snap-center grid-cols-[84px_1fr] gap-[11px] rounded-[14px] border bg-white p-2.5 transition-colors",
        isSelected ? "border-nokta-ink" : "border-nokta-border",
      )}
    >
      <VenueImage venue={item.venue} alt="" className="h-[84px] w-[84px] rounded-[10px] object-cover" monogramClassName="rounded-[10px]" />
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold text-nokta-ink">{item.venue.name}</h3>
        <p className="truncate text-[12.5px] text-nokta-ink-muted">{where(item)}</p>
        <p className="mt-1 truncate text-[12.5px] text-nokta-ink-subtle">{facts(item.venue)}</p>
        <StatusLine item={item} />
      </div>
    </Link>
  );
}

function VenueRow({ item, isSelected, onHover }: { item: MapVenue; isSelected: boolean; onHover: () => void }) {
  return (
    <Link
      to={`/venues/${item.venue.slug}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn("grid grid-cols-[92px_1fr] gap-3 border-t border-nokta-divider py-3.5 first:border-t-0", isSelected && "lg:bg-nokta-hover")}
    >
      <VenueImage venue={item.venue} alt="" className="h-[92px] w-[92px] rounded-[10px] object-cover" monogramClassName="rounded-[10px]" />
      <div className="min-w-0">
        <h3 className="truncate text-[15.5px] font-semibold text-nokta-ink">{item.venue.name}</h3>
        <p className="truncate text-[12.5px] text-nokta-ink-muted">{where(item)}</p>
        <p className="mt-1.5 text-[12.5px] text-nokta-ink-subtle">{facts(item.venue)}</p>
        <StatusLine item={item} />
      </div>
    </Link>
  );
}
