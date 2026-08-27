export interface PromotedOfferSafetyResult {
  safe: boolean;
  blockingReasons: string[];
  warnings: string[];
}

const BLOCKED_TERMS = ["free shisha", "2-for-1 shisha", "discount shisha", "discounted shisha", "cheap shisha", "new flavour", "tobacco", "nicotine"];

export function checkPromotedOfferSafety(input: { title: string; description?: string | null; terms?: string | null }): PromotedOfferSafetyResult {
  const copy = [input.title, input.description, input.terms].filter(Boolean).join(" ").toLowerCase();
  const matches = BLOCKED_TERMS.filter((term) => copy.includes(term));
  const blockingReasons = matches.map((term) => `Copy contains risky wording: "${term}".`);

  return {
    safe: blockingReasons.length === 0,
    blockingReasons,
    warnings: blockingReasons.length ? ["Use safer wording such as birthday package, group booking, food offer or event package."] : [],
  };
}
