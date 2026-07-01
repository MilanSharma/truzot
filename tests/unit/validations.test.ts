/**
 * Unit tests for validation schemas (Zod schemas)
 */

import { describe, it, expect } from "vitest";
import {
  signupSchema,
  checkoutSchema,
  retrySchema,
  uploadActionSchema,
  teamDemoSchema,
  generateTriggerSchema,
  freeGenerateSchema,
  contactSchema,
  validate,
  emailField,
  passwordField,
  planField,
} from "@/lib/validations";

describe("Validation Schemas", () => {
  describe("emailField", () => {
    it("accepts valid email addresses", () => {
      const result = emailField.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      const result = emailField.safeParse("invalid-email");
      expect(result.success).toBe(false);
    });

    it("rejects emails longer than 255 characters", () => {
      const longEmail = "a".repeat(250) + "@example.com"; // 250 + 12 = 262 characters
      const result = emailField.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe("passwordField", () => {
    it("accepts valid passwords", () => {
      const result = passwordField.safeParse("password123");
      expect(result.success).toBe(true);
    });

    it("rejects passwords shorter than 6 characters", () => {
      const result = passwordField.safeParse("12345");
      expect(result.success).toBe(false);
    });

    it("rejects passwords longer than 128 characters", () => {
      const longPassword = "a".repeat(129);
      const result = passwordField.safeParse(longPassword);
      expect(result.success).toBe(false);
    });
  });

  describe("planField", () => {
    it("accepts valid plan values", () => {
      const validPlans = ["basic", "pro", "executive"];
      validPlans.forEach((plan) => {
        const result = planField.safeParse(plan);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid plan values", () => {
      const result = planField.safeParse("invalid");
      expect(result.success).toBe(false);
    });
  });

  describe("signupSchema", () => {
    it("accepts valid signup data", () => {
      const result = signupSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts signup data without name", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = signupSchema.safeParse({
        email: "invalid",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 200 characters", () => {
      const result = signupSchema.safeParse({
        name: "a".repeat(201),
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkoutSchema", () => {
    it("accepts valid checkout data", () => {
      const result = checkoutSchema.safeParse({
        plan: "basic",
        email: "test@example.com",
        storagePath: "test-uploads/path",
        selectedStyles: ["auto"],
        idempotencyKey: "checkout-123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const result = checkoutSchema.safeParse({
        plan: "pro",
        email: "test@example.com",
        storagePath: "test-uploads/path",
        selectedStyles: ["auto"],
        idempotencyKey: "checkout-123",
        shootName: "My Shoot",
        coupon: "DISCOUNT10",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid plan", () => {
      const result = checkoutSchema.safeParse({
        plan: "invalid",
        email: "test@example.com",
        selectedStyles: ["auto"],
        idempotencyKey: "checkout-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty selectedStyles", () => {
      const result = checkoutSchema.safeParse({
        plan: "basic",
        email: "test@example.com",
        selectedStyles: [],
        idempotencyKey: "checkout-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing idempotencyKey", () => {
      const result = checkoutSchema.safeParse({
        plan: "basic",
        email: "test@example.com",
        selectedStyles: ["auto"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid zipUrl", () => {
      const result = checkoutSchema.safeParse({
        plan: "basic",
        email: "test@example.com",
        zipUrl: "not-a-url",
        selectedStyles: ["auto"],
        idempotencyKey: "checkout-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("retrySchema", () => {
    it("accepts valid UUID", () => {
      const result = retrySchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const result = retrySchema.safeParse({
        orderId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing orderId", () => {
      const result = retrySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("uploadActionSchema", () => {
    it("accepts valid get-upload-url action", () => {
      const result = uploadActionSchema.safeParse({
        action: "get-upload-url",
        filename: "test.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid get-download-url action", () => {
      const result = uploadActionSchema.safeParse({
        action: "get-download-url",
        path: "test-uploads/path",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid check action", () => {
      const result = uploadActionSchema.safeParse({
        action: "check",
        path: "test-uploads/path",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid action", () => {
      const result = uploadActionSchema.safeParse({
        action: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("teamDemoSchema", () => {
    it("accepts valid team demo request", () => {
      const result = teamDemoSchema.safeParse({
        email: "team@example.com",
        company: "Test Company",
        employees: 10,
      });
      expect(result.success).toBe(true);
    });

    it("accepts request without optional fields", () => {
      const result = teamDemoSchema.safeParse({
        email: "team@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = teamDemoSchema.safeParse({
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty company name", () => {
      const result = teamDemoSchema.safeParse({
        email: "team@example.com",
        company: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative employee count", () => {
      const result = teamDemoSchema.safeParse({
        email: "team@example.com",
        employees: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("generateTriggerSchema", () => {
    it("accepts valid orderId", () => {
      const result = generateTriggerSchema.safeParse({
        orderId: "test-order-id",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing orderId", () => {
      const result = generateTriggerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("freeGenerateSchema", () => {
    it("accepts valid zipUrl", () => {
      const result = freeGenerateSchema.safeParse({
        zipUrl: "https://example.com/test.zip",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const result = freeGenerateSchema.safeParse({
        zipUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing zipUrl", () => {
      const result = freeGenerateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("contactSchema", () => {
    it("accepts valid contact form data", () => {
      const result = contactSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        subject: "Test Subject",
        message: "Test message",
      });
      expect(result.success).toBe(true);
    });

    it("accepts form without optional fields", () => {
      const result = contactSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = contactSchema.safeParse({
        name: "",
        email: "test@example.com",
        message: "Test message",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = contactSchema.safeParse({
        name: "Test User",
        email: "invalid",
        message: "Test message",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty message", () => {
      const result = contactSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        message: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects message longer than 5000 characters", () => {
      const result = contactSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        message: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validate helper function", () => {
    it("returns data for valid input", () => {
      const result = validate(signupSchema, {
        email: "test@example.com",
        password: "password123",
      });
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("returns error for invalid input", () => {
      const result = validate(signupSchema, {
        email: "invalid",
        password: "123",
      });
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it("formats multiple errors correctly", () => {
      const result = validate(signupSchema, {
        email: "invalid",
        password: "123",
      });
      expect(result.error).toContain("email");
      expect(result.error).toContain("password");
    });
  });
});
