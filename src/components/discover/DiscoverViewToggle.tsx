import { List, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiscoverView } from "@/types/filters";

export function DiscoverViewToggle({ value, onChange }: { value: DiscoverView; onChange: (view: DiscoverView) => void }) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-1">
      <Button
        type="button"
        variant={value === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
      >
        <List className="mr-2 h-4 w-4" />
        List
      </Button>
      <Button
        type="button"
        variant={value === "map" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("map")}
        aria-pressed={value === "map"}
      >
        <Map className="mr-2 h-4 w-4" />
        Map
      </Button>
    </div>
  );
}
