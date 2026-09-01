import type { OwnerOnboardingTask } from "@/types/ownerOnboarding";

export function OwnerOnboardingProgress({ tasks }: { tasks: OwnerOnboardingTask[] }) {
  const total = tasks.length || 7;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-nokta-ink">Profile setup</span>
        <span className="text-nokta-ink-muted">{completed} of {total} complete</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-nokta-page-bg">
        <div className="h-full rounded-full bg-nokta-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
