/** @type {import('next').NextConfig} */
const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
const supabaseHost = SUPABASE_PROJECT_ID ? `${SUPABASE_PROJECT_ID}.supabase.co` : 'none.supabase.co';

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '*.fal.media' },
      { protocol: 'https', hostname: supabaseHost },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  try {
    const { withSentryConfig } = require('@sentry/nextjs');
    module.exports = withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
    });
  } catch {
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
