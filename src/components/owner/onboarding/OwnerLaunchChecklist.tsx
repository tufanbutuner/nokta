import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OwnerOnboardingProgress } from "@/components/owner/onboarding/OwnerOnboardingProgress";
import { trackEvent } from "@/lib/analytics";
import type { OwnerOnboardingTask, OwnerOnboardingTaskKey } from "@/types/ownerOnboarding";
import type { Venue } from "@/types/venue";

const taskContent: Record<OwnerOnboardingTaskKey, { title: string; description: string; cta: string; href: (venue: Venue) => string }> = {
  claim_approved: { title: "Claim approved", description: "Your venue is connected to your owner account.", cta: "View dashboard", href: (venue) => `/owner/venues/${venue.slug}` },
  review_profile: { title: "Review profile details", description: "Check address, contact links, features, prices and venue copy.", cta: "Review profile", href: (venue) => `/owner/venues/${venue.slug}/update` },
  upload_photos: { title: "Upload venue photos", description: "Add original photos so customers know what to expect.", cta: "Upload photos", href: (venue) => `/owner/venues/${venue.slug}/media` },
  configure_availability: { title: "Configure booking availability", description: "Set the days, times and party sizes you can handle.", cta: "Set availability", href: (venue) => `/owner/venues/${venue.slug}/availability` },
  test_booking: { title: "Test a booking request", description: "Submit a test request and check the owner response workflow.", cta: "Open bookings", href: () => "/owner/bookings" },
  enable_notifications: { title: "Check notifications", description: "Make sure booking and enquiry alerts reach the right place.", cta: "View notifications", href: () => "/account/notifications" },
  review_pricing: { title: "Review pricing/features", description: "Compare owner tools and decide when to unlock paid features.", cta: "View plans", href: () => "/owner/billing#owner-plans" },
};

export function OwnerLaunchChecklist({ venue, tasks, onComplete }: { venue: Venue; tasks: OwnerOnboardingTask[]; onComplete: (taskKey: OwnerOnboardingTaskKey) => void }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Owner setup checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">Complete these steps when you are ready. They do not block access to your dashboard.</p>
        </div>
        <div className="min-w-[220px]">
          <OwnerOnboardingProgress tasks={tasks} />
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {tasks.map((task) => {
          const content = taskContent[task.taskKey];
          const complete = task.status === "completed";

          return (
            <article key={task.taskKey} className="flex flex-col gap-4 rounded-xl border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-nokta-accent" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                <div>
                  <h3 className="font-semibold">{content.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{content.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!complete ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => onComplete(task.taskKey)}>
                    Mark done
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm" onClick={() => trackEvent("owner_onboarding_task_clicked", { venueId: venue.id, taskKey: task.taskKey })}>
                  <Link to={content.href(venue)}>{content.cta}<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
