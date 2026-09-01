const faqs = [
  ["What does claiming a venue mean?", "Claiming lets you manage parts of your venue profile, receive booking requests, upload original photos and access owner tools."],
  ["How is Nokta different from Google or Instagram?", "Google is broad and social media creates attention. Nokta gives social venues a structured profile, booking request flow, enquiries and owner tools in one place."],
  ["Is claiming free?", "Yes. Claiming a venue profile is free. Paid plans unlock additional commercial tools."],
  ["Can I update my venue details?", "Yes. Owners can submit profile update requests for review."],
  ["Can I receive bookings through Nokta?", "Yes. Customers can request bookings, and you can accept, decline or propose another time."],
  ["Is Nokta only for shisha lounges?", "Nokta is starting with shisha lounges and late-night lounge venues, but the platform is designed for broader social venues."],
] as const;

export function OwnerFaq() {
  return (
    <div className="divide-y divide-nokta-border overflow-hidden rounded-2xl border border-nokta-border bg-white">
      {faqs.map(([question, answer]) => (
        <details key={question} className="group relative isolate overflow-hidden p-5">
          <img
            src="/nokta-dot.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-10 -z-10 h-32 w-32 opacity-[0.045]"
          />
          <summary className="cursor-pointer list-none font-semibold text-nokta-ink">{question}</summary>
          <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">{answer}</p>
        </details>
      ))}
    </div>
  );
}
