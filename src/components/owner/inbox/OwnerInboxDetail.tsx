import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { UpgradePrompt } from "@/components/subscriptions/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getOwnerInboxStatus, getOwnerInboxStatusTone, relativeAge } from "@/lib/ownerInbox";
import { cn } from "@/lib/utils";
import type { BookingRequestStatus } from "@/types/bookingRequests";
import type { OwnerInboxItem } from "@/types/ownerInbox";
import type { VenuePlan } from "@/types/subscriptions";
import type { VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerInboxDetail({ item, venue, currentPlan, isSaving, onBack, onBookingStatus, onSuggestTime, onEnquiryStatus, onSendReply }: {
  item: OwnerInboxItem;
  venue?: Venue;
  currentPlan: VenuePlan;
  isSaving: boolean;
  onBack: () => void;
  onBookingStatus: (status: BookingRequestStatus, response?: string) => void;
  onSuggestTime: () => void;
  onEnquiryStatus: (status: VenueEnquiryStatus) => void;
  onSendReply: (message: string) => void;
}) {
  const [reply, setReply] = useState("");
  const [savedReply, setSavedReply] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const locked = item.type === "enquiry" && !item.enquiry.hasFullAccess;
  const tone = getOwnerInboxStatusTone(item);

  useEffect(() => {
    const existing = item.type === "booking" ? item.booking.ownerResponseMessage ?? "" : item.enquiry.venueResponse ?? "";
    setReply(existing);
    setSavedReply(existing);
  }, [item]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.metaKey && !event.ctrlKey && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        replyRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const name = item.type === "booking" ? item.booking.customerName : item.enquiry.customerName;
  const subtitle = item.type === "booking"
    ? `${formatLongDate(item.booking.requestedDate)}, ${item.booking.requestedTime} · ${venue?.name ?? "Venue"}, ${venue?.area ?? ""}`
    : `${venue?.name ?? "Venue"}${item.enquiry.preferredDate ? ` · Preferred ${formatLongDate(item.enquiry.preferredDate)}` : ""}`;
  const cannedReplies = item.type === "booking"
    ? ["Confirm as asked", "Fully booked, offer 22:00", "Indoor only tonight"]
    : ["Thanks — we’ll be in touch", "Please call the venue", "We can accommodate this"];

  return (
    <article className="flex min-h-0 flex-col gap-4 p-[20px_24px]">
      <Button type="button" variant="ghost" className="h-8 self-start px-2 lg:hidden" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back to inbox</Button>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-[5px] px-[7px] py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.3px]", item.type === "booking" ? "bg-clay-accent/12 text-[#a44a30]" : "bg-[oklch(0.93_0.03_250)] text-[oklch(0.36_0.08_250)]")}>{item.type}</span>
          <span className={cn("rounded-full px-2 py-[2px] text-[11px] font-semibold", tone === "attention" ? "bg-[oklch(0.96_0.045_75)] text-[oklch(0.36_0.08_75)]" : tone === "progressed" ? "bg-[oklch(0.94_0.02_150)] text-[oklch(0.36_0.06_150)]" : "bg-muted text-muted-foreground")}>{getOwnerInboxStatus(item)} · {relativeAge(item.createdAt)}</span>
        </div>
        <h2 className="mt-2 font-brand text-[21px] font-bold tracking-[-0.3px]">{name}{item.type === "booking" ? ` · ${item.booking.partySize} people` : ""}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      </div>

      {item.type === "booking" && item.booking.status === "pending" ? (
        <div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={() => onBookingStatus("accepted", reply)}>Confirm</Button>
            <Button variant="outline" className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={onSuggestTime}>Suggest another time</Button>
            <Button variant="outline" className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={() => onBookingStatus("declined", reply)}>Decline</Button>
          </div>
          {/**
           * Confirm and Decline send whatever is in the reply box as their
           * message, which is useful for "see you at 8" and actively misleading
           * for "fully booked" — the customer is told the booking is confirmed
           * and shown a message saying it is not. Say so where the decision is
           * made, rather than leaving the box to look like a separate action.
           */}
          {reply.trim() && reply !== savedReply ? <p className="mt-2 text-xs text-muted-foreground">Confirm and Decline will send your reply as the message. To reply without deciding, use Send reply below.</p> : null}
        </div>
      ) : item.type === "enquiry" && !locked ? (
        <div className="flex flex-wrap gap-2">
          <Button className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={() => onEnquiryStatus("contacted")}>Mark contacted</Button>
          <Button variant="outline" className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={() => onEnquiryStatus("converted")}>Mark converted</Button>
          <Button variant="outline" className="h-[38px] text-[13.5px]" disabled={isSaving} onClick={() => onEnquiryStatus("closed")}>Close</Button>
        </div>
      ) : null}

      {locked ? (
        <UpgradePrompt feature="owner_enquiry_inbox" requiredPlan="growth" currentPlan={currentPlan} venueId={item.venueId} />
      ) : (
        <>
          <section className="rounded-xl border bg-card p-[16px_18px]">
            <dl className="grid grid-cols-1 gap-[14px_20px] sm:grid-cols-2">
              {item.type === "booking" ? (
                <>
                  <Detail label="Party size" value={`${item.booking.partySize} people`} />
                  <Detail label="Occasion" value={item.booking.occasion ?? "Not specified"} />
                  <Detail label="Phone" value={item.booking.customerPhone ?? "Not supplied"} />
                  <Detail label="Email" value={item.booking.customerEmail} />
                </>
              ) : (
                <>
                  <Detail label="Occasion" value={formatOccasion(item.enquiry.enquiryType)} />
                  <Detail label="Party size" value={item.enquiry.partySize ? `${item.enquiry.partySize} people` : "Not specified"} />
                  <Detail label="Phone" value={item.enquiry.customerPhone ?? "Not supplied"} />
                  <Detail label="Email" value={item.enquiry.customerEmail ?? "Not supplied"} />
                </>
              )}
            </dl>
            <div className="mt-[14px] border-t pt-[14px]">
              <p className="text-[11.5px] text-muted-foreground">Their message</p>
              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.6]">{item.type === "booking" ? item.booking.message ?? "No message supplied." : item.enquiry.message ?? "No message supplied."}</p>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-[16px_18px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[14px] font-semibold">Reply</h3>
              <p className="text-xs text-muted-foreground">sent as {venue?.name ?? "your venue"}; the customer is notified by email</p>
            </div>
            <Textarea ref={replyRef} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply…" className="mt-3 min-h-16 rounded-[9px] bg-background p-[11px_12px] text-[13px]" />
            <div className="mt-3 flex flex-wrap gap-2">
              {cannedReplies.map((message) => <button key={message} type="button" onClick={() => setReply(message)} className="rounded-full border bg-[oklch(0.96_0.02_55)] px-[10px] py-[5px] text-xs">{message}</button>)}
            </div>
            <Button type="button" className="mt-3 h-[34px] text-[13px]" disabled={!reply.trim() || isSaving} onClick={() => onSendReply(reply.trim())}>{isSaving ? "Sending…" : "Send reply"}</Button>
          </section>
        </>
      )}

      <footer className="text-xs text-muted-foreground">Received {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} via nokta · View customer’s other requests</footer>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11.5px] text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-[13.5px] font-medium">{value}</dd></div>;
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function formatOccasion(value: string) {
  return value.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}
