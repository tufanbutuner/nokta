/// <reference types="node" />

/**
 * Venues that discovery keeps finding but that do not belong in the directory.
 *
 * Deleting a row from the database is not enough on its own: the venue is still in the
 * generated file, so the next reconcile run inserts it again. Listing it here keeps it out
 * of the output in the first place.
 *
 * Add a venue here when it is not a shisha venue at all, rather than when its details are
 * merely wrong — a venue with a bad address should be corrected, not excluded.
 */

export type ExcludedVenue = {
  /** Matched against the discovered slug, case-insensitively. */
  slug: string;
  /** Why it is excluded, so a later reader does not undo this without knowing. */
  reason: string;
};

export const EXCLUDED_VENUES: ExcludedVenue[] = [
  {
    slug: "lounge-bohemia-by-appointment-shoreditch",
    reason: "Cocktail bar, not a shisha venue. Matched only on the word 'lounge' in its name.",
  },
  {
    slug: "142b-lounge-nightclub-city-centre",
    reason: "Nightclub, not a shisha venue. Matched on 'lounge' in its name.",
  },
  {
    slug: "sky-blue-vape-lounge-earlsdon",
    reason: "Vape shop, not a shisha lounge. Matched on 'lounge' in its name.",
  },
  {
    slug: "sky-blue-vape-lounge-foleshill",
    reason: "Vape shop, not a shisha lounge. Matched on 'lounge' in its name.",
  },
  {
    slug: "vapourz-lounge-vape-shop-tooting-broadway-49-tooting-high-st",
    reason: "Vape shop, not a shisha lounge. Matched on 'lounge' in its name.",
  },
  {
    slug: "atmos-central-vape-e-cig-and-coffee-lounge-westcotes",
    reason: "Vape and e-cigarette shop, not a shisha lounge. Matched on 'lounge' in its name.",
  },
  {
    slug: "ibrox-vapes-and-shisha-centre-govan",
    reason: "Shop selling shisha products, not a lounge to sit and smoke in.",
  },
  {
    slug: "eye-cloud-vape-shisha-grinder-bong-gift-shop-st-pauls",
    reason: "Shop selling shisha products, not a lounge to sit and smoke in.",
  },
];

const EXCLUDED_SLUGS = new Set(EXCLUDED_VENUES.map((entry) => entry.slug.toLowerCase()));

export function isExcludedVenue(slug: string) {
  return EXCLUDED_SLUGS.has(slug.trim().toLowerCase());
}
