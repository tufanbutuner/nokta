/// <reference types="node" />

/**
 * Tells a venue you can visit apart from a business you only buy from, using Google's own
 * place types rather than the venue's name.
 *
 * This lives in its own module so the audit script can use it without importing
 * `discover-venues.ts`, which starts a discovery run as soon as it is loaded.
 */

/**
 * Google place types that mean somewhere you buy from rather than sit in. A shisha shop, a
 * wholesaler and a delivery service all read like a lounge by name alone — seventeen of them
 * reached the directory before this filter existed and had to be removed by hand — but Google
 * classifies them plainly, so the type is far better evidence than the name.
 */
const NON_VENUE_TYPES = new Set([
  "store", "wholesaler", "shipping_service", "meal_takeaway", "meal_delivery",
  "grocery_store", "food_store", "supermarket", "convenience_store",
  "electronics_store", "gift_shop", "tobacco_shop", "liquor_store",
  "moving_company", "storage", "corporate_office", "general_contractor",
]);

/**
 * Types that confirm somewhere you can actually visit and sit. A place carrying one of these
 * is kept even when it also carries a retail type, since many lounges also sell what they serve.
 */
const VENUE_TYPES = new Set([
  "hookah_bar", "bar", "restaurant", "cafe", "night_club", "lounge_bar",
  "coffee_shop", "bakery", "meal_takeaway_and_restaurant", "food_court",
]);

/**
 * True when Google describes this as somewhere to visit rather than somewhere to buy from.
 * A venue type anywhere in the list wins, because a lounge that also sells shisha is still a
 * lounge; only when nothing says "venue" does a retail type disqualify it.
 */
export function isVisitableVenue(place: { primaryType?: string; types?: string[] }) {
  const types = place.types ?? [];

  // `primaryType` is Google's own answer to "what is this place mainly", so it decides first.
  // Several shops carry hookah_bar or restaurant among their secondary types while being a
  // shop primarily — Shisha Delivery lists hookah_bar, Highgate Shisha Shop lists hookah_bar,
  // and both are retail — so a venue type further down the list must not override it.
  if (place.primaryType) {
    if (NON_VENUE_TYPES.has(place.primaryType)) return false;
    if (VENUE_TYPES.has(place.primaryType)) return true;
  }

  // With no primary type to go on, a venue type anywhere is enough: a lounge that also sells
  // what it serves is still a lounge.
  if (types.some((type) => VENUE_TYPES.has(type))) return true;
  return !types.some((type) => NON_VENUE_TYPES.has(type));
}
