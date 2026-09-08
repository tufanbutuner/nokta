import { Input } from "@/components/ui/input";

const DATA_SOURCE_FIELDS = [
  ["officialWebsite", "Official website source"],
  ["instagram", "Instagram source"],
  ["bookingUrl", "Booking URL"],
  ["menuUrl", "Menu URL"],
  ["shishaMenuUrl", "Shisha menu URL"],
  ["shishaPageUrl", "Shisha page URL"],
  ["directorySource", "Directory source"],
  ["companiesHouseSource", "Companies House source"],
  ["foodHygieneSource", "Food hygiene source"],
  ["tripadvisorSource", "Tripadvisor source"],
  ["westfieldSource", "Westfield source"],
  ["otherSource", "Other source"],
] as const;

export function DataSourcesEditor({
  value,
  errors,
  onChange,
}: {
  value: Record<string, string>;
  errors: Record<string, string>;
  onChange: (sources: Record<string, string>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DATA_SOURCE_FIELDS.map(([key, label]) => {
        const error = errors[`dataSources.${key}`];

        return (
          <label key={key} className="grid gap-2 text-sm font-medium" data-field-error={error ? "true" : undefined}>
            {label}
            <Input value={value[key] ?? ""} onChange={(event) => onChange({ ...value, [key]: event.target.value })} placeholder="https://" />
            {error ? <span className="text-xs text-red-700">{error}</span> : null}
        </label>
        );
      })}
    </div>
  );
}
