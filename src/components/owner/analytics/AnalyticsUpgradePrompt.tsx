import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AnalyticsUpgradePrompt({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <Button asChild className="mt-5" variant="outline">
        <Link to="/owner/pricing">View plans</Link>
      </Button>
    </section>
  );
}
