import type { Venue } from "@/types/venue";
import { getCityByName } from "@/lib/cities";

export type VenueQualityLevel = "good" | "needs-work" | "poor";

export interface VenueQualityIssue {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
}

export interface VenueQualityResult {
  score: number;
  level: VenueQualityLevel;
  issues: VenueQualityIssue[];
}

export interface VenueQualitySummary {
  totalVenues: number;
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  openCount: number;
  unknownBusinessStatusCount: number;
  missingOpeningHoursCount: number;
  missingPhoneCount: number;
  missingWebsiteCount: number;
  missingInstagramCount: number;
  missingPriceCount: number;
  missingImagesCount: number;
  missingOfficialSourceCount: number;
  thirdPartyOnlySourceCount: number;
  questionableCoordinatesCount: number;
  goodQualityCount: number;
  needsWorkQualityCount: number;
  poorQualityCount: number;
}

export interface VenueQualitySummaryByCity {
  city: string;
  totalVenues: number;
  verifiedCount: number;
  missingOpeningHoursCount: number;
  missingImagesCount: number;
  poorQualityCount: number;
}

export type DataQualityFilter =
  | "all"
  | "poor"
  | "needs-work"
  | "good"
  | "missing-opening-hours"
  | "missing-phone"
  | "missing-price"
  | "missing-official-source"
  | "third-party-only"
  | "questionable-coordinates";

const OFFICIAL_SOURCE_KEYS = new Set(["officialWebsite", "officialLinktree", "instagram", "venueHostWebsite", "westfieldSource"]);
const THIRD_PARTY_SOURCE_KEYS = new Set([
  "directorySource",
  "companiesHouseSource",
  "foodHygieneSource",
  "tripadvisorSource",
  "bookingSource",
]);

const ISSUE_SCORE_DEDUCTIONS: Record<string, number> = {
  "missing-official-source": 20,
  "missing-opening-hours": 15,
  "missing-phone": 8,
  "missing-price": 8,
  "missing-images": 8,
  "unverified": 20,
  "partially-verified": 10,
  "unknown-business-status": 12,
  "missing-source-notes": 8,
  "questionable-coordinates": 25,
  "missing-shisha-source": 20,
};

export function getVenueQuality(venue: Venue): VenueQualityResult {
  const issues = getVenueQualityIssues(venue);
  const score = clampScore(
    100 - issues.reduce((total, issue) => total + (ISSUE_SCORE_DEDUCTIONS[issue.key] ?? 0), 0),
  );

  return {
    score,
    level: getVenueQualityLevel(score),
    issues,
  };
}

export function getVenueQualityIssues(venue: Venue): VenueQualityIssue[] {
  const issues: VenueQualityIssue[] = [];

  if (!hasOfficialSource(venue)) {
    issues.push({ key: "missing-official-source", label: "Missing official source", severity: "high" });
  }

  if (!hasValue(venue.website)) {
    issues.push({ key: "missing-website", label: "Missing website", severity: "medium" });
  }

  if (!hasOpeningHours(venue)) {
    issues.push({ key: "missing-opening-hours", label: "Missing opening hours", severity: "high" });
  }

  if (!hasValue(venue.phone)) {
    issues.push({ key: "missing-phone", label: "Missing phone", severity: "medium" });
  }

  if (!hasValue(venue.instagram)) {
    issues.push({ key: "missing-instagram", label: "Missing Instagram", severity: "low" });
  }

  if (venue.priceFrom == null) {
    issues.push({ key: "missing-price", label: "Missing shisha price", severity: "medium" });
  }

  if (!venue.images.length) {
    issues.push({ key: "missing-images", label: "Missing images", severity: "medium" });
  }

  if (venue.verificationStatus === "unverified") {
    issues.push({ key: "unverified", label: "Unverified", severity: "high" });
  }

  if (venue.verificationStatus === "partially-verified") {
    issues.push({ key: "partially-verified", label: "Partially verified", severity: "medium" });
  }

  if (venue.businessStatus === "unknown") {
    issues.push({ key: "unknown-business-status", label: "Unknown business status", severity: "high" });
  }

  if (!hasValue(venue.sourceNotes)) {
    issues.push({ key: "missing-source-notes", label: "Missing source notes", severity: "medium" });
  }

  if (hasOnlyThirdPartySources(venue)) {
    issues.push({ key: "third-party-only", label: "Only third-party sources", severity: "medium" });
  }

  if (hasQuestionableCoordinates(venue)) {
    issues.push({ key: "questionable-coordinates", label: "Questionable coordinates", severity: "high" });
  }

  if (!hasShishaSpecificSource(venue)) {
    issues.push({ key: "missing-shisha-source", label: "No shisha-specific source", severity: "high" });
  }

  return issues;
}

export function getVenueQualityLevel(score: number): VenueQualityLevel {
  if (score >= 80) {
    return "good";
  }

  if (score >= 50) {
    return "needs-work";
  }

  return "poor";
}

export function getVenueQualitySummary(venues: Venue[]): VenueQualitySummary {
  return venues.reduce<VenueQualitySummary>(
    (summary, venue) => {
      const quality = getVenueQuality(venue);

      summary.totalVenues += 1;
      summary.verifiedCount += venue.verificationStatus === "verified" ? 1 : 0;
      summary.partiallyVerifiedCount += venue.verificationStatus === "partially-verified" ? 1 : 0;
      summary.unverifiedCount += venue.verificationStatus === "unverified" ? 1 : 0;
      summary.openCount += venue.businessStatus === "open" ? 1 : 0;
      summary.unknownBusinessStatusCount += venue.businessStatus === "unknown" ? 1 : 0;
      summary.missingOpeningHoursCount += hasOpeningHours(venue) ? 0 : 1;
      summary.missingPhoneCount += hasValue(venue.phone) ? 0 : 1;
      summary.missingWebsiteCount += hasValue(venue.website) ? 0 : 1;
      summary.missingInstagramCount += hasValue(venue.instagram) ? 0 : 1;
      summary.missingPriceCount += venue.priceFrom == null ? 1 : 0;
      summary.missingImagesCount += venue.images.length ? 0 : 1;
      summary.missingOfficialSourceCount += hasOfficialSource(venue) ? 0 : 1;
      summary.thirdPartyOnlySourceCount += hasOnlyThirdPartySources(venue) ? 1 : 0;
      summary.questionableCoordinatesCount += hasQuestionableCoordinates(venue) ? 1 : 0;
      summary.goodQualityCount += quality.level === "good" ? 1 : 0;
      summary.needsWorkQualityCount += quality.level === "needs-work" ? 1 : 0;
      summary.poorQualityCount += quality.level === "poor" ? 1 : 0;

      return summary;
    },
    {
      totalVenues: 0,
      verifiedCount: 0,
      partiallyVerifiedCount: 0,
      unverifiedCount: 0,
      openCount: 0,
      unknownBusinessStatusCount: 0,
      missingOpeningHoursCount: 0,
      missingPhoneCount: 0,
      missingWebsiteCount: 0,
      missingInstagramCount: 0,
      missingPriceCount: 0,
      missingImagesCount: 0,
      missingOfficialSourceCount: 0,
      thirdPartyOnlySourceCount: 0,
      questionableCoordinatesCount: 0,
      goodQualityCount: 0,
      needsWorkQualityCount: 0,
      poorQualityCount: 0,
    },
  );
}

export function getVenueQualitySummaryByCity(venues: Venue[]): VenueQualitySummaryByCity[] {
  const summaries = new Map<string, VenueQualitySummaryByCity>();

  for (const venue of venues) {
    const quality = getVenueQuality(venue);
    const summary =
      summaries.get(venue.city) ??
      {
        city: venue.city,
        totalVenues: 0,
        verifiedCount: 0,
        missingOpeningHoursCount: 0,
        missingImagesCount: 0,
        poorQualityCount: 0,
      };

    summary.totalVenues += 1;
    summary.verifiedCount += venue.verificationStatus === "verified" ? 1 : 0;
    summary.missingOpeningHoursCount += hasOpeningHours(venue) ? 0 : 1;
    summary.missingImagesCount += venue.images.length ? 0 : 1;
    summary.poorQualityCount += quality.level === "poor" ? 1 : 0;
    summaries.set(venue.city, summary);
  }

  return Array.from(summaries.values()).sort((first, second) => first.city.localeCompare(second.city));
}

export function hasOfficialSource(venue: Venue): boolean {
  return Object.entries(venue.dataSources).some(([key, value]) => OFFICIAL_SOURCE_KEYS.has(key) && hasValue(value));
}

export function hasOnlyThirdPartySources(venue: Venue): boolean {
  const sourceEntries = Object.entries(venue.dataSources).filter(([, value]) => hasValue(value));

  return sourceEntries.length > 0 && sourceEntries.every(([key]) => THIRD_PARTY_SOURCE_KEYS.has(key));
}

export function hasShishaSpecificSource(venue: Venue): boolean {
  const sourceNotes = venue.sourceNotes?.toLowerCase() ?? "";
  const description = venue.description.toLowerCase();
  const name = venue.name.toLowerCase();

  return (
    hasValue(venue.dataSources.shishaMenuUrl) ||
    hasValue(venue.dataSources.shishaPageUrl) ||
    sourceNotes.includes("shisha") ||
    description.includes("shisha") ||
    name.includes("shisha")
  );
}

export function hasQuestionableCoordinates(venue: Venue): boolean {
  if (!Number.isFinite(venue.latitude) || !Number.isFinite(venue.longitude)) {
    return true;
  }

  if (venue.latitude === 0 || venue.longitude === 0) {
    return true;
  }

  const city = getCityByName(venue.city);

  if (!city) {
    return false;
  }

  return Math.abs(venue.latitude - city.latitude) > 0.5 || Math.abs(venue.longitude - city.longitude) > 0.7;
}

export function filterVenuesByQualityIssue(venues: Venue[], filter: DataQualityFilter): Venue[] {
  if (filter === "all") {
    return venues;
  }

  return venues.filter((venue) => {
    const quality = getVenueQuality(venue);
    const issueKeys = new Set(quality.issues.map((issue) => issue.key));

    if (filter === "good" || filter === "needs-work" || filter === "poor") {
      return quality.level === filter;
    }

    if (filter === "third-party-only") {
      return hasOnlyThirdPartySources(venue);
    }

    if (filter === "questionable-coordinates") {
      return hasQuestionableCoordinates(venue);
    }

    return issueKeys.has(filter);
  });
}

function hasOpeningHours(venue: Venue): boolean {
  return venue.openingHours.some((item) => hasValue(item.day) && hasValue(item.open) && hasValue(item.close));
}

function hasValue(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
