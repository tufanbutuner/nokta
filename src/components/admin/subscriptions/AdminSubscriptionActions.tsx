import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/types/venue";

export function AdminSubscriptionActions({
  venue,
  onEdit,
  onTrial,
  onCancel,
  isSaving,
}: {
  venue: Venue;
  onEdit: () => void;
  onTrial: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
      <Button size="sm" variant="outline" onClick={onTrial}><Play className="mr-1 h-3.5 w-3.5" />Trial</Button>
      <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}><XCircle className="mr-1 h-3.5 w-3.5" />Cancel</Button>
      <Button size="sm" variant="outline" asChild><Link to={`/venues/${venue.slug}`}><ExternalLink className="mr-1 h-3.5 w-3.5" />View</Link></Button>
      <Button size="sm" variant="outline" asChild><Link to={`/admin/venues/${venue.slug}/edit`}>Admin edit</Link></Button>
    </div>
  );
}
