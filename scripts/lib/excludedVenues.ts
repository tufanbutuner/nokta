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
  {
    slug: "shisha-delivery-13a-crawford-st",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "shisha-delivery-nottingham-city-centre",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "shisha-wholesale-manchester-roe-lee",
    reason: "Wholesaler (Google primaryType: wholesaler), not a venue to visit.",
  },
  {
    slug: "eden-shisha-lounge-hire-and-events-manchester-and-cheshire-ardwick",
    reason: "Equipment hire and events service (Google primaryType: shipping_service), not a fixed venue.",
  },
  {
    slug: "the-shisha-shop-bradford-city-centre",
    reason: "Shop selling shisha products (Google primaryType: store), not a lounge.",
  },
  {
    slug: "l-and-a-shisha-shop-govan",
    reason: "Shop selling shisha products (Google primaryType: store), not a lounge.",
  },
  {
    slug: "highgate-shisha-shop-balsall-heath",
    reason: "Shop selling shisha products (Google primaryType: store), not a lounge.",
  },
  {
    slug: "king-shisha-store-sheffield-burngreave",
    reason: "Shop selling shisha products (Google primaryType: store), not a lounge.",
  },
  {
    slug: "amalfi-lounge-online-darwen",
    reason: "Takeaway (Google primaryType: meal_takeaway), not a shisha lounge.",
  },
  {
    slug: "hookah-shisha-sheesha-and-pipes-city-centre",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisha-town-mcr-levenshulme",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisha-on-wheels-glasgow-pollokshields",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "vaporz-and-shisha-214-edgware-rd",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "foji-s-ice-lounge-burslem",
    reason: "Dessert shop (Google primaryType: dessert_shop), not a venue to visit.",
  },
  {
    slug: "dial-a-shisha-highfields",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "rumaan-dial-a-shisha-cheetham-hill",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "babley-shisha-evington",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisharoo-highfields",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "shisha-drop-evington",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "shisha-corner-sneinton",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisha-planet-leagrave",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisha-and-sweet-paan-centre-bedfodshire",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "shisha-coco-mammut-foleshill",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "imjustshisha-office-14",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
  {
    slug: "shisha-house-newcastle-fenham",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "exhale-shisha-fenham",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "mu-assel-dial-a-shisha-town-centre",
    reason: "Shop selling shisha products (Google primaryType: store), not a venue to visit.",
  },
  {
    slug: "dial-me-a-shisha-heaton",
    reason: "Delivery service (Google primaryType: shipping_service), not a venue to visit.",
  },
];

const EXCLUDED_SLUGS = new Set(EXCLUDED_VENUES.map((entry) => entry.slug.toLowerCase()));

export function isExcludedVenue(slug: string) {
  return EXCLUDED_SLUGS.has(slug.trim().toLowerCase());
}
