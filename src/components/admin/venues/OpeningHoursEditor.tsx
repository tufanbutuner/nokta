import { Input } from "@/components/ui/input";
import type { OpeningHours } from "@/types/venue";

export function OpeningHoursEditor({ value, onChange }: { value: OpeningHours[]; onChange: (hours: OpeningHours[]) => void }) {
  function updateRow(index: number, field: keyof OpeningHours, nextValue: string) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: nextValue } : item)));
  }

  return (
    <div className="grid gap-3">
      {value.map((item, index) => (
        <div key={`${item.day}-${index}`} className="grid gap-2 sm:grid-cols-[140px_1fr_1fr] sm:items-center">
          <Input value={item.day} onChange={(event) => updateRow(index, "day", event.target.value)} aria-label={`Day ${index + 1}`} />
          <Input type="time" value={item.open} onChange={(event) => updateRow(index, "open", event.target.value)} aria-label={`${item.day} open`} />
          <Input type="time" value={item.close} onChange={(event) => updateRow(index, "close", event.target.value)} aria-label={`${item.day} close`} />
        </div>
      ))}
    </div>
  );
}
