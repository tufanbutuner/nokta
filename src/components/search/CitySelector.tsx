import { Select } from "@/components/ui/select";
import { getCityOptions } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function CitySelector({
  value,
  onChange,
  id = "city-filter",
  activeOnly = true,
  className,
}: {
  value: string;
  onChange: (city: string) => void;
  id?: string;
  activeOnly?: boolean;
  className?: string;
}) {
  return (
    <Select
      id={id}
      aria-label="City"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={getCityOptions({ activeOnly })}
      className={cn("w-full", className)}
    />
  );
}
