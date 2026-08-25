import { AdminSuggestionActions, type SuggestionAction } from "@/components/admin/suggestions/AdminSuggestionActions";
import { SuggestionStatusBadge } from "@/components/admin/suggestions/SuggestionStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { VenueSuggestion } from "@/types/venueSuggestions";

export function AdminSuggestionTable({
  suggestions,
  pendingSuggestionId,
  onAction,
}: {
  suggestions: VenueSuggestion[];
  pendingSuggestionId?: string | null;
  onAction: (action: SuggestionAction, suggestion: VenueSuggestion) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Contact/source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={suggestion.id} className="border-t align-top">
                  <td className="max-w-md px-4 py-4">
                    <div className="font-medium">{suggestion.venueName}</div>
                    <p className="mt-1 text-muted-foreground">{suggestion.address || "Address TBC"}</p>
                    {suggestion.notes ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">Notes: {suggestion.notes}</p> : null}
                    {suggestion.adminNotes ? (
                      <p className="mt-2 rounded-lg bg-background/70 p-2 text-xs text-muted-foreground">Admin: {suggestion.adminNotes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {[suggestion.area, suggestion.postcode].filter(Boolean).join(" • ") || "TBC"}
                  </td>
                  <td className="px-4 py-4">
                    <ContactList suggestion={suggestion} />
                  </td>
                  <td className="px-4 py-4">
                    <SuggestionStatusBadge status={suggestion.status} />
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(suggestion.createdAt)}</td>
                  <td className="px-4 py-4">
                    <AdminSuggestionActions
                      suggestion={suggestion}
                      isPending={pendingSuggestionId === suggestion.id}
                      onAction={onAction}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactList({ suggestion }: { suggestion: VenueSuggestion }) {
  const items = [
    suggestion.website ? { label: "Website", value: suggestion.website, href: suggestion.website } : null,
    suggestion.instagram ? { label: "Instagram", value: suggestion.instagram, href: suggestion.instagram } : null,
    suggestion.phone ? { label: "Phone", value: suggestion.phone, href: `tel:${suggestion.phone}` } : null,
  ].filter((item): item is { label: string; value: string; href: string } => Boolean(item));

  if (!items.length) {
    return <span className="text-muted-foreground">No contact details</span>;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <a key={item.label} className="block max-w-[220px] truncate font-medium hover:underline" href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {item.label}
        </a>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
