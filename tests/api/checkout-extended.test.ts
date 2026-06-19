import { describe, it, expect } from "vitest";

describe("checkoutSchema extended", () => {
  it("validates pro plan", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "pro",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.plan).toBe("pro");
  });

  it("validates executive plan", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "executive",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.plan).toBe("executive");
  });

  it("rejects invalid plan value", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "enterprise",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("plan");
  });

  it("rejects invalid email format", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "not-an-email",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("email");
  });

  it("rejects missing email", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("email");
  });

  it("rejects empty email string", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("email");
  });

  it("rejects missing idempotencyKey", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate"],
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("idempotencyKey");
  });

  it("rejects empty idempotencyKey", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("idempotencyKey");
  });

  it("rejects empty selectedStyles", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: [],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("selectedStyles");
  });

  it("accepts all optional fields omitted", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.plan).toBe("basic");
    expect(result.data?.email).toBe("test@example.com");
    expect(result.data?.zipUrl).toBeUndefined();
    expect(result.data?.gender).toBeUndefined();
    expect(result.data?.eyeColor).toBeUndefined();
    expect(result.data?.hairColor).toBeUndefined();
    expect(result.data?.clothing).toBeUndefined();
    expect(result.data?.background).toBeUndefined();
    expect(result.data?.framing).toBeUndefined();
    expect(result.data?.userId).toBeUndefined();
    expect(result.data?.shootName).toBeUndefined();
    expect(result.data?.coupon).toBeUndefined();
  });

  it("accepts optional fields at max length", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const longStr = "a".repeat(50);
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
      gender: longStr,
      eyeColor: longStr,
      hairColor: longStr,
      clothing: longStr,
      background: longStr,
      framing: longStr,
      shootName: "a".repeat(100),
      coupon: "a".repeat(50),
      zipUrl: "https://example.com/photos.zip",
      storagePath: "uploads/some/path.zip",
      userId: "user-123",
    });
    expect(result.error).toBeUndefined();
  });

  it("rejects invalid zipUrl", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      zipUrl: "not-a-url",
      selectedStyles: ["corporate"],
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("zipUrl");
  });

  it("rejects missing selectedStyles", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      idempotencyKey: "test-key-123",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("selectedStyles");
  });

  it("validates idempotency key is returned correctly", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate"],
      idempotencyKey: "custom-idempotency-key",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.idempotencyKey).toBe("custom-idempotency-key");
  });

  it("accepts any string values for style fields", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      selectedStyles: ["corporate", "creative", "natural"],
      idempotencyKey: "test-key-123",
      gender: "female",
      eyeColor: "green",
      hairColor: "blonde",
      clothing: "casual",
      background: "outdoor",
      framing: "full-body",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.gender).toBe("female");
    expect(result.data?.eyeColor).toBe("green");
    expect(result.data?.hairColor).toBe("blonde");
    expect(result.data?.clothing).toBe("casual");
    expect(result.data?.background).toBe("outdoor");
    expect(result.data?.framing).toBe("full-body");
  });
});
