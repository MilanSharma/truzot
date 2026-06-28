export function isFeatureEnabled(feature: string): boolean {
  const envVar = `ENABLE_${feature.toUpperCase()}`;
  const value = process.env[envVar];
  return value === 'true' || value === '1';
}

export const FEATURES = {
  AFFILIATES: isFeatureEnabled('affiliates'),
  FREE_PREVIEW: isFeatureEnabled('free_preview'),
  SEO_PAGES: isFeatureEnabled('seo_pages'),
} as const;
