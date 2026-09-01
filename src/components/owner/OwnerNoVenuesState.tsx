import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function OwnerNoVenuesState() {
  return (
    <section className="rounded-xl border bg-card p-8 text-center">
      <h2 className="text-2xl font-semibold">No claimed venues yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Claim an existing venue profile or list your venue to start managing bookings, enquiries and profile details on Nokta.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild><Link to="/discover">Find your venue</Link></Button>
        <Button asChild variant="outline"><Link to="/suggest">Suggest a venue</Link></Button>
        <Button asChild variant="outline"><Link to="/for-venues">For venues</Link></Button>
      </div>
    </section>
  );
}
