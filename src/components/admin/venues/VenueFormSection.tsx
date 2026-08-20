import { Card, CardContent } from "@/components/ui/card";

export function VenueFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="mt-5 grid gap-4">{children}</div>
      </CardContent>
    </Card>
  );
}
