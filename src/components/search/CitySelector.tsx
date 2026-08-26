import { Select } from "@/components/ui/select";
import { getCityOptions } from "@/lib/cities";

export function CitySelector({
  value,
  onChange,
  id = "city-filter",
  activeOnly = true,
}: {
  value: string;
  onChange: (city: string) => void;
  id?: string;
  activeOnly?: boolean;
}) {
  return (
    <Select
      id={id}
      aria-label="City"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={getCityOptions({ activeOnly })}
      className="w-full"
    />
  );
}
