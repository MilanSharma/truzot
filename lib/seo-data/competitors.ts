/**
 * Competitor data for the /compare/<slug> pages.
 *
 * These pages are the landing pages for our "<competitor> alternative" paid
 * keywords, so every figure here must be accurate and verifiable against the
 * vendor's own public pricing/policy pages or independent reviews. False or
 * exaggerated claims about a named competitor are a legal risk (false
 * advertising) and violate Google Ads' comparative-advertising policy.
 *
 * Rule: if a figure can't be verified, omit the row rather than guess.
 * Figures below reflect published 2026 pricing and policies.
 */

export interface Competitor {
  name: string;
  price: string;
  turnaround: string;
  selfies: string;
  refund: string;
}

export const COMPETITORS: Record<string, Competitor> = {
  "aragon-alternative": {
    name: "Aragon AI",
    price: "$35-$75",
    turnaround: "15-45 minutes",
    selfies: "12+ required",
    refund: "7-day money-back",
  },
  "headshotpro-alternative": {
    name: "HeadshotPro",
    price: "$29-$49",
    turnaround: "1-4 hours",
    selfies: "~15-25 required",
    refund: "14 days — only if you haven't downloaded any photo",
  },
  "betterpic-alternative": {
    name: "BetterPic",
    price: "$19-$59",
    turnaround: "1-4 hours",
    selfies: "Multiple required",
    refund: "7-day (terms apply)",
  },
};

export const COMPARE_SLUGS = Object.keys(COMPETITORS);
