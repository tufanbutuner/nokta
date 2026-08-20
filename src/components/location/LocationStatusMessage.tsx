import type { LocationStatus } from "@/types/location";

const messages: Partial<Record<LocationStatus, { title: string; body: string }>> = {
  error: {
    title: "Location unavailable",
    body: "We couldn't access your location. You can still browse venues manually.",
  },
  denied: {
    title: "Location permission denied",
    body: "Enable location access in your browser settings to sort by nearest.",
  },
  unsupported: {
    title: "Geolocation not supported",
    body: "Your browser does not support location-based discovery.",
  },
};

export function LocationStatusMessage({ status }: { status: LocationStatus }) {
  const message = messages[status];

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-md border bg-background/60 p-3 text-sm">
      <p className="font-medium">{message.title}</p>
      <p className="mt-1 text-muted-foreground">{message.body}</p>
    </div>
  );
}
