import { describe, it, expect } from "vitest";

describe("checkoutSchema", () => {
  it("validates a correct checkout payload", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, {
      plan: "basic",
      email: "test@example.com",
      zipUrl: "https://example.com/photos.zip",
      gender: "male",
      eyeColor: "brown",
      profession: "engineer",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.plan).toBe("basic");
  });

  it("rejects missing plan", async () => {
    const { checkoutSchema, validate } = await import("@/lib/validations");
    const result = validate(checkoutSchema, { email: "test@example.com" });
    expect(result.error).toBeDefined();
  });
});
