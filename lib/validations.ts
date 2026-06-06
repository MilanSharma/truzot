import { z } from "zod";

export const emailField = z.string().email("Invalid email address").max(255);
export const passwordField = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128);
export const planField = z.enum(["basic", "pro", "executive"]);

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const checkoutSchema = z.object({
  plan: planField,
  email: emailField,
  zipUrl: z.string().url(),
  storagePath: z.string().optional(),
  gender: z.string().min(1).max(50),
  eyeColor: z.string().min(1).max(50),
  profession: z.string().min(1).max(100),
  selectedStyles: z.array(z.string()).min(1).optional(),
  userId: z.string().optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export const retrySchema = z.object({
  orderId: z.string().uuid(),
});

export const uploadActionSchema = z.object({
  action: z.enum(["get-upload-url", "get-download-url"]),
  filename: z.string().optional(),
  path: z.string().optional(),
});

export const teamDemoSchema = z.object({
  email: emailField,
  company: z.string().min(1).max(200).optional(),
  employees: z.number().int().positive().optional(),
});

export const generateTriggerSchema = z.object({
  orderId: z.string(),
});

export const freeGenerateSchema = z.object({
  zipUrl: z.string().url(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: emailField,
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  orderId: z.string().max(100).optional(),
});

function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: formatZodErrors(result.error) };
  }
  return { data: result.data };
}
