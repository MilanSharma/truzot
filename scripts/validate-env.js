/**
 * Validates critical environment variables at startup.
 * Run this before the app boots to catch missing config early.
 *
 * Usage in next.config.js:
 *   require('./scripts/validate-env.js');
 *
 * Or run directly:
 *   node scripts/validate-env.js
 */

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "FAL_KEY",
  "FAL_WEBHOOK_SECRET",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const RECOMMENDED = [
  "STRIPE_PRICE_BASIC",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_EXECUTIVE",
  "QSTASH_TOKEN",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "SENTRY_DSN",
];

const missing = REQUIRED.filter((key) => !process.env[key]);
const missingRec = RECOMMENDED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n🔴 FATAL: Missing required environment variables:\n  ${missing.join("\n  ")}\n`,
  );
  process.exit(1);
}

if (missingRec.length > 0) {
  console.warn(
    `\n⚠️  Warning: Missing recommended environment variables:\n  ${missingRec.join("\n  ")}\n`,
  );
}

console.log("✅ Environment validation passed");
