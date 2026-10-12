import { Alert } from "@/components/ui/alert";

export function VenueFormWarnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <Alert className="border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink">
      <h2 className="font-semibold">Data quality warnings</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Alert>
  );
}
