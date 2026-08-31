import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { formatBookingRequestDateTime } from "@/lib/bookingRequestLabels";
import { canCustomerRespondToAlternative, getCustomerBookingStatusCopy, isCustomerBookingConfirmed } from "@/lib/customerBookingStatusLabels";
import { acceptCustomerBookingAlternative, declineCustomerBookingAlternative, getCustomerBookingStatus } from "@/services/customerBookingStatusService";
import type { CustomerBookingStatus } from "@/types/customerBookingStatus";

export function CustomerBookingStatusPage() {
  const { token = "" } = useParams();
  const [booking, setBooking] = useState<CustomerBookingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCustomerBookingStatus(token)
      .then((next) => {
        if (!cancelled) setBooking(next);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load booking status.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  async function respond(action: "accept" | "decline") {
    setIsMutating(true);
    setError(null);
    try {
      const next = action === "accept"
        ? await acceptCustomerBookingAlternative({ token, responseMessage: message })
        : await declineCustomerBookingAlternative({ token, responseMessage: message });
      setBooking(next);
      setMessage("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update booking status.");
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) return <main><PageContainer className="py-20"><LoadingState message="Loading booking status..." /></PageContainer></main>;
  if (error && !booking) return <main><PageContainer className="py-20"><ErrorState title="Could not load booking" message={error} /></PageContainer></main>;
  if (!booking) return <main><PageMeta title="Booking status unavailable | nokta" description="This booking status link is invalid or expired." /><PageContainer className="py-20"><ErrorState title="Booking status unavailable" message="This link is invalid or has expired." /></PageContainer></main>;

  const copy = getCustomerBookingStatusCopy(booking.status);
  const confirmed = isCustomerBookingConfirmed(booking);
  const canRespond = canCustomerRespondToAlternative(booking);

  return (
    <main>
      <PageMeta title={`Booking status for ${booking.venueName} | nokta`} description="Track your nokta booking request status." canonicalPath={`/booking-status/${token}`} />
      <PageContainer className="py-10">
        <Card className="mx-auto max-w-3xl">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{booking.venueCity} • {booking.venueArea}</p>
                <h1 className="mt-2 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">{copy.title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
              </div>
              {booking.confirmationReference ? <div className="rounded-xl border bg-muted/50 px-4 py-3 text-sm"><span className="block text-xs uppercase text-muted-foreground">Reference</span><strong>{booking.confirmationReference}</strong></div> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatusItem label="Venue" value={booking.venueName} />
              <StatusItem label="Booking status" value={confirmed ? "Confirmed" : copy.title} />
              <StatusItem label="Date and time" value={formatBookingRequestDateTime(booking.requestedDate, booking.requestedTime)} />
              <StatusItem label="Party size" value={`${booking.partySize} people`} />
              {booking.occasion ? <StatusItem label="Occasion" value={booking.occasion} /> : null}
              {booking.confirmedAt ? <StatusItem label="Confirmed" value={new Date(booking.confirmedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} /> : null}
            </div>

            {booking.ownerResponseMessage ? <Alert><strong>Venue message</strong><span className="mt-1 block whitespace-pre-line">{booking.ownerResponseMessage}</span></Alert> : null}
            {booking.proposedDate && booking.proposedTime ? <Alert><strong>Alternative time</strong><span className="mt-1 block">{formatBookingRequestDateTime(booking.proposedDate, booking.proposedTime)}</span>{booking.proposedMessage ? <span className="mt-2 block whitespace-pre-line">{booking.proposedMessage}</span> : null}</Alert> : null}
            {booking.customerAlternativeResponseMessage ? <Alert><strong>Your response</strong><span className="mt-1 block whitespace-pre-line">{booking.customerAlternativeResponseMessage}</span></Alert> : null}

            {canRespond ? (
              <div className="space-y-3 rounded-xl border p-4">
                <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional message to the venue" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button disabled={isMutating} onClick={() => respond("accept")}>Accept alternative</Button>
                  <Button disabled={isMutating} variant="outline" onClick={() => respond("decline")}>Decline alternative</Button>
                </div>
              </div>
            ) : null}

            {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
            <Button asChild variant="outline" onClick={() => trackEvent("customer_booking_status_cta_clicked", { venueId: booking.venueId, status: booking.status })}><Link to={`/venues/${booking.venueSlug}`}>View venue</Link></Button>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/30 p-4"><span className="block text-xs uppercase text-muted-foreground">{label}</span><strong className="mt-1 block">{value}</strong></div>;
}
