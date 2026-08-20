import { Card, CardContent } from "@/components/ui/card";

export function DataQualityEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <h2 className="text-xl font-semibold">No venues match this filter</h2>
        <p className="mt-2 text-muted-foreground">Choose another quality filter to continue auditing the catalogue.</p>
      </CardContent>
    </Card>
  );
}
