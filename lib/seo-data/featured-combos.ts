/**
 * Which profession × city combo pages are worth letting Google index.
 *
 * We generate PROFESSIONS × CITIES = 286 combo pages from a single ~40-line
 * template. Each renders ~670 words that differ only by two substituted
 * variables, which is close enough to Google's "doorway pages" definition
 * (mass-generated pages funnelling visitors to one destination, with little
 * unique value) to be a real manual-action risk on a young domain.
 *
 * Rather than delete the routes — existing links keep working — we index only
 * the combos that pass two tests:
 *
 *  1. The profession has genuine LOCAL search intent. A realtor, lawyer,
 *     doctor or actor is hired locally, so "lawyer headshots chicago" is a
 *     real query. Nobody searches "linkedin headshots in phoenix" — those
 *     combos exist only to catch a keyword and are pure doorway pages.
 *
 *  2. The city is a market we actually serve. Pricing is USD and paid
 *     targeting is US-only, so the non-US entries in CITIES (pune-in,
 *     solapur-in, tel-aviv-il, paris-fr, …) are excluded here.
 *
 * Everything outside this list still renders but is marked noindex, so it
 * can't drag down sitewide quality signals. Widen the list once individual
 * pages earn genuinely unique content (local market data, real examples).
 */

export const FEATURED_COMBO_PROFESSIONS = [
  "real-estate-agent",
  "lawyer",
  "doctor",
  "actor",
] as const;

export const FEATURED_COMBO_CITIES = [
  "new-york",
  "los-angeles",
  "chicago",
  "houston",
  "dallas",
  "austin",
  "san-diego",
  "philadelphia",
] as const;

/** True when a combo page should be indexed and listed in the sitemap. */
export function isFeaturedCombo(professionId: string, cityId: string): boolean {
  return (
    (FEATURED_COMBO_PROFESSIONS as readonly string[]).includes(professionId) &&
    (FEATURED_COMBO_CITIES as readonly string[]).includes(cityId)
  );
}
