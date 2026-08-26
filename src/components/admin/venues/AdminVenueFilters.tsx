import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CitySelector } from "@/components/search/CitySelector";
import type { VenueQualityLevel } from "@/lib/venueQuality";
import type { VerificationStatus } from "@/types/venue";

export type AdminVenueVerificationFilter = "all" | VerificationStatus;
export type AdminVenueQualityFilter = "all" | VenueQualityLevel;

export function AdminVenueFilters({
  query,
  city,
  verificationStatus,
  qualityLevel,
  onQueryChange,
  onCityChange,
  onVerificationStatusChange,
  onQualityLevelChange,
}: {
  query: string;
  city: string;
  verificationStatus: AdminVenueVerificationFilter;
  qualityLevel: AdminVenueQualityFilter;
  onQueryChange: (query: string) => void;
  onCityChange: (city: string) => void;
  onVerificationStatusChange: (status: AdminVenueVerificationFilter) => void;
  onQualityLevelChange: (level: AdminVenueQualityFilter) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_200px_220px_180px]">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search by name, city, area or postcode"
        aria-label="Search venues"
      />
      <CitySelector id="admin-city-filter" value={city} onChange={onCityChange} />
      <Select
        value={verificationStatus}
        onChange={(event) => onVerificationStatusChange(event.target.value as AdminVenueVerificationFilter)}
        aria-label="Filter by verification status"
        options={[
          { label: "All verification", value: "all" },
          { label: "Verified", value: "verified" },
          { label: "Partially verified", value: "partially-verified" },
          { label: "Unverified", value: "unverified" },
        ]}
      />
      <Select
        value={qualityLevel}
        onChange={(event) => onQualityLevelChange(event.target.value as AdminVenueQualityFilter)}
        aria-label="Filter by quality"
        options={[
          { label: "All quality", value: "all" },
          { label: "Good", value: "good" },
          { label: "Needs work", value: "needs-work" },
          { label: "Poor", value: "poor" },
        ]}
      />
    </div>
  );
}
