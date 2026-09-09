import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ProfileDiffTable } from "@/components/owner/updates/ProfileDiffTable";
import { cn } from "@/lib/utils";
import { getProfileDiff } from "@/lib/venueProfileDiff";
import type { VenueUpdateRequest, VenueUpdateRequestStatus } from "@/types/venueUpdateRequests";

const STATUS_DOT: Record<VenueUpdateRequestStatus, string> = {
  pending: "bg-clay-300",
  approved: "bg-forest-400",
  applied: "bg-forest-400",
  rejected: "bg-clay-accent",
  cancelled: "bg-nokta-ink-muted",
};

/** The rail says "In review"; the full list keeps the canonical wording. */
const STATUS_LABEL: Record<VenueUpdateRequestStatus, string> = {
  pending: "In review",
  approved: "Approved",
  applied: "Applied",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function OwnerRecentRequestsCard({
  requests,
  onCancel,
  cancellingId,
}: {
  requests: VenueUpdateRequest[];
  onCancel?: (request: VenueUpdateRequest) => void;
  cancellingId?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = requests.slice(0, 3);

  return (
    <section className="rounded-[14px] border border-nokta-border bg-white p-[18px]">
      <h2 className="mb-3 text-sm font-semibold text-nokta-ink">Recent requests</h2>
      {visible.length ? (
        <div className="flex flex-col gap-3">
          {visible.map((request) => {
            const diff = getProfileDiff(request.originalSnapshot, request.requestedChanges);
            const isOpen = openId === request.id;

            return (
              <div key={request.id} className="flex gap-2.5">
                <span aria-hidden="true" className={cn("mt-[5px] size-[7px] shrink-0 rounded-full", STATUS_DOT[request.status])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-nokta-ink">
                    {STATUS_LABEL[request.status]}
                    {diff.length ? ` · ${diff.map((row) => row.label).join(", ")}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-nokta-ink-muted">
                    {request.status === "pending" ? "Submitted " : ""}
                    {new Date(request.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {diff.length ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          className="cursor-pointer font-medium text-clay-accent hover:underline"
                          onClick={() => setOpenId(isOpen ? null : request.id)}
                        >
                          {isOpen ? "Hide" : "View"}
                          <ChevronDown aria-hidden="true" className={cn("ml-0.5 inline size-3 transition-transform", isOpen && "rotate-180")} />
                        </button>
                      </>
                    ) : null}
                    {request.status === "pending" && onCancel ? (
                      <>
                        {" · "}
                        <button type="button" className="cursor-pointer font-medium text-clay-accent hover:underline disabled:opacity-60" disabled={cancellingId === request.id} onClick={() => onCancel(request)}>
                          {cancellingId === request.id ? "Cancelling..." : "Cancel"}
                        </button>
                      </>
                    ) : null}
                  </p>

                  {isOpen ? (
                    <div className="mt-2.5">
                      <ProfileDiffTable rows={diff} compact />
                      {request.requestNotes ? (
                        <p className="mt-2 text-xs leading-5 text-nokta-ink-muted"><span className="font-medium text-nokta-ink">Your note:</span> {request.requestNotes}</p>
                      ) : null}
                      {request.adminNotes ? (
                        <p className="mt-2 text-xs leading-5 text-nokta-ink-muted"><span className="font-medium text-nokta-ink">nokta:</span> {request.adminNotes}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-nokta-ink-muted">No profile update requests yet.</p>
      )}
    </section>
  );
}
