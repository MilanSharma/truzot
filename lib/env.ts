import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_BASIC: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_EXECUTIVE: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  FAL_KEY: z.string().min(1),
  FAL_WEBHOOK_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  QSTASH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (validatedEnv) return validatedEnv;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .filter(
        (i) => i.code === "invalid_type" || i.message.includes("Required"),
      )
      .map((i) => i.path.join("."));
    throw new Error(
      `Missing or invalid environment variables: ${missing.join(", ")}`,
    );
  }
  validatedEnv = result.data;
  return validatedEnv;
}
