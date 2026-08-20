import { Button } from "@/components/ui/button";
import { VIBE_OPTIONS } from "@/lib/venueFilters";
import type { VenueVibe } from "@/types/venue";

export function VibeFilter({ value, onChange }: { value: VenueVibe[]; onChange: (vibes: VenueVibe[]) => void }) {
  function toggle(vibe: VenueVibe) {
    onChange(value.includes(vibe) ? value.filter((item) => item !== vibe) : [...value, vibe]);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Vibes</p>
      <div className="flex flex-wrap gap-2">
        {VIBE_OPTIONS.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              onClick={() => toggle(option.value)}
              aria-pressed={selected}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
