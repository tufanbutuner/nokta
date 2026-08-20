import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationStatus, UserLocation } from "@/types/location";

interface UseLocationButtonProps {
  status: LocationStatus;
  onLocationFound: (location: UserLocation) => void;
  onStatusChange: (status: LocationStatus) => void;
}

const buttonLabel: Record<LocationStatus, string> = {
  idle: "Use my location",
  loading: "Finding location...",
  success: "Location enabled",
  error: "Try again",
  denied: "Location denied",
  unsupported: "Location unsupported",
};

export function UseLocationButton({ status, onLocationFound, onStatusChange }: UseLocationButtonProps) {
  function requestLocation() {
    if (!navigator.geolocation) {
      onStatusChange("unsupported");
      return;
    }

    onStatusChange("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationFound({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        onStatusChange("success");
      },
      (error) => {
        onStatusChange(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  return (
    <Button
      type="button"
      variant={status === "success" ? "secondary" : "outline"}
      onClick={requestLocation}
      disabled={status === "loading" || status === "unsupported"}
    >
      <LocateFixed className="mr-2 h-4 w-4" />
      {buttonLabel[status]}
    </Button>
  );
}
