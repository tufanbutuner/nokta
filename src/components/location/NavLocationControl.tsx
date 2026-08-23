import { FormEvent, useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppLocation } from "@/context/AppLocationContext";
import { cn } from "@/lib/utils";

export function NavLocationControl({ compact = false }: { compact?: boolean }) {
  const { savedLocation, locationStatus, hasCoordinates, setManualLocation, useCurrentLocation, clearLocation } = useAppLocation();
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState(savedLocation?.label ?? "");
  const popoverRef = useRef<HTMLDivElement>(null);
  const label = savedLocation?.label ?? "Set location";
  const statusMessage = getLocationStatusMessage(locationStatus);

  useEffect(() => {
    setManualValue(savedLocation?.label ?? "");
  }, [savedLocation?.label]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", closeOnOutsideClick);
    }

    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  async function submitManualLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await setManualLocation(manualValue);
    setOpen(false);
  }

  function selectCurrentLocation() {
    useCurrentLocation();
  }

  function removeLocation() {
    clearLocation();
    setManualValue("");
  }

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex h-9 max-w-[210px] items-center gap-2 rounded-full border bg-card px-3 text-sm font-medium text-foreground shadow-sm shadow-stone-950/5 transition-colors hover:bg-secondary",
          compact && "h-10 w-10 justify-center rounded-lg px-0 md:h-9 md:w-auto md:justify-start md:rounded-full md:px-3",
        )}
        aria-expanded={open}
        aria-label="Set location"
        onClick={() => setOpen((value) => !value)}
      >
        <MapPin className="h-4 w-4 shrink-0 text-accent" />
        <span className={cn("truncate", compact && "hidden md:block")}>{label}</span>
      </button>

      {open ? (
        <div className="fixed left-3 right-3 top-[4.5rem] z-[1300] rounded-2xl border bg-card p-3 shadow-2xl shadow-stone-950/15 md:absolute md:left-0 md:right-auto md:top-12 md:w-80">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Your location</p>
              <p className="mt-1 text-xs text-muted-foreground">Used for distance, nearest sorting and recommendations.</p>
            </div>
            <button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close location menu" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="space-y-2" onSubmit={submitManualLocation}>
            <Input value={manualValue} onChange={(event) => setManualValue(event.target.value)} placeholder="Postcode or area" />
            <Button type="submit" className="w-full" disabled={locationStatus === "loading"}>
              Save location
            </Button>
          </form>

          <div className="my-3 h-px bg-border" />

          <Button type="button" variant="outline" className="w-full" onClick={selectCurrentLocation} disabled={locationStatus === "loading" || locationStatus === "unsupported"}>
            <LocateFixed className="mr-2 h-4 w-4" />
            {locationStatus === "loading" ? "Finding location..." : "Use current location"}
          </Button>
          {statusMessage ? <p className="mt-2 text-xs text-muted-foreground">{statusMessage}</p> : null}

          {savedLocation ? (
            <div className="mt-3 rounded-xl bg-background/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{savedLocation.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hasCoordinates ? "Distance-aware location saved." : "Saved as your search context."}
                  </p>
                </div>
                <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={removeLocation}>
                  Clear
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getLocationStatusMessage(status: ReturnType<typeof useAppLocation>["locationStatus"]): string | null {
  if (status === "denied") {
    return "Location permission was denied. You can still type an area or postcode.";
  }

  if (status === "error") {
    return "We could not get your location. Try again or enter it manually.";
  }

  if (status === "unsupported") {
    return "Your browser does not support location lookup.";
  }

  return null;
}
