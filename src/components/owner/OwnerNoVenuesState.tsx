import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function OwnerNoVenuesState() {
  return (
    <section className="rounded-xl border bg-card p-8 text-center">
      <h2 className="text-2xl font-semibold">You do not have any claimed venues yet.</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        If you own or manage a venue listed on Sheesha, open the venue page and request to claim it.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild><Link to="/discover">Find your venue</Link></Button>
        <Button asChild variant="outline"><Link to="/suggest">Suggest a venue</Link></Button>
      </div>
    </section>
  );
}
