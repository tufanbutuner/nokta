import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function VenueSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search venues, areas or vibes..."
        className="pl-9"
      />
    </div>
  );
}
