import { Button } from "@/components/ui/button";
import type { VenueVibe } from "@/types/venue";

const VIBE_OPTIONS: VenueVibe[] = ["casual", "luxury", "date-night", "groups", "football", "late-night", "quiet", "party", "rooftop", "outdoor"];

export function VibeSelector({ value, onChange }: { value: VenueVibe[]; onChange: (vibes: VenueVibe[]) => void }) {
  function toggleVibe(vibe: VenueVibe) {
    onChange(value.includes(vibe) ? value.filter((item) => item !== vibe) : [...value, vibe]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VIBE_OPTIONS.map((vibe) => (
        <Button key={vibe} type="button" size="sm" variant={value.includes(vibe) ? "default" : "outline"} onClick={() => toggleVibe(vibe)}>
          {vibe.replace("-", " ")}
        </Button>
      ))}
    </div>
  );
}
