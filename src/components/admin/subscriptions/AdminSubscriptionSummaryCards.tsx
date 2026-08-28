import type { VenueSubscription } from "@/types/subscriptions";

export function AdminSubscriptionSummaryCards({ subscriptions }: { subscriptions: VenueSubscription[] }) {
  const cards = [
    { label: "Total subscriptions", value: subscriptions.length },
    { label: "Free", value: subscriptions.filter((item) => item.plan === "free").length },
    { label: "Starter", value: subscriptions.filter((item) => item.plan === "starter").length },
    { label: "Growth", value: subscriptions.filter((item) => item.plan === "growth").length },
    { label: "Pro", value: subscriptions.filter((item) => item.plan === "pro").length },
    { label: "Trials", value: subscriptions.filter((item) => item.status === "trial").length },
    { label: "Active", value: subscriptions.filter((item) => item.status === "active").length },
    { label: "Past due", value: subscriptions.filter((item) => item.status === "past_due").length },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-black/[0.04] bg-white p-4">
          <p className="text-[12px] font-medium text-[#8a7e72]">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-clay-600">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
