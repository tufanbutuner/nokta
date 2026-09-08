const faqs = [
  ["How is Nokta different from Google or Instagram?", "Google is broad and social media creates attention. Nokta gives social venues a structured profile, booking request flow, enquiries and owner tools in one place."],
  ["Do I have to stop using my current booking system?", "No. Requests arrive in Nokta and you confirm them however you already work. Nokta doesn't hold your tables."],
  ["Is claiming free?", "Yes. Claiming a venue profile is free. Paid plans unlock additional commercial tools."],
  ["Is Nokta only for shisha lounges?", "Nokta is starting with shisha lounges and late-night lounge venues, but the platform is designed for broader social venues."],
  ["What if my venue is already listed?", "Claim it. Until you do, the page sends customers to your website or phone rather than taking a booking nobody would answer."],
] as const;

export function OwnerFaq() {
  return <div className="divide-y divide-nokta-border overflow-hidden rounded-2xl border border-nokta-border bg-white">{faqs.map(([question, answer]) => <details key={question} className="group px-5 py-4"><summary className="cursor-pointer list-none text-[14.5px] font-semibold text-nokta-ink">{question}</summary><p className="mt-2 text-[13.5px] leading-[1.65] text-nokta-ink-muted">{answer}</p></details>)}</div>;
}
