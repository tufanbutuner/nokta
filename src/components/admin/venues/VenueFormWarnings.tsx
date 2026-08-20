import { Alert } from "@/components/ui/alert";

export function VenueFormWarnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
      <h2 className="font-semibold">Data quality warnings</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Alert>
  );
}
