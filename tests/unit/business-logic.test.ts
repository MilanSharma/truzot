/**
 * Unit tests for business logic
 */

import { describe, it, expect } from "vitest";
import { PLANS, PLAN_SHOTS, getPlanById, type PlanId } from "@/lib/plans";
import { isValidTransition } from "@/lib/order-status";

describe("Business Logic", () => {
  describe("PLANS", () => {
    it("contains all expected plans", () => {
      expect(PLANS).toHaveProperty("basic");
      expect(PLANS).toHaveProperty("pro");
      expect(PLANS).toHaveProperty("executive");
    });

    it("has correct plan structure", () => {
      Object.values(PLANS).forEach((plan) => {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("price");
        expect(plan).toHaveProperty("amount");
        expect(plan).toHaveProperty("shots");
        expect(plan).toHaveProperty("turnaround");
        expect(plan).toHaveProperty("resolution");
        expect(plan).toHaveProperty("slug");
      });
    });

    it("basic plan has correct values", () => {
      expect(PLANS.basic.id).toBe("basic");
      expect(PLANS.basic.price).toBe(29);
      expect(PLANS.basic.amount).toBe(2900);
      expect(PLANS.basic.shots).toBe(40);
      expect(PLANS.basic.popular).toBe(false);
    });

    it("pro plan is marked as popular", () => {
      expect(PLANS.pro.popular).toBe(true);
    });

    it("executive plan has highest shot count", () => {
      expect(PLANS.executive.shots).toBeGreaterThan(PLANS.pro.shots);
      expect(PLANS.executive.shots).toBeGreaterThan(PLANS.basic.shots);
    });
  });

  describe("PLAN_SHOTS", () => {
    it("matches plan shot counts", () => {
      expect(PLAN_SHOTS.basic).toBe(PLANS.basic.shots);
      expect(PLAN_SHOTS.pro).toBe(PLANS.pro.shots);
      expect(PLAN_SHOTS.executive).toBe(PLANS.executive.shots);
    });

    it("includes custom_upsell option", () => {
      expect(PLAN_SHOTS).toHaveProperty("custom_upsell");
      expect(PLAN_SHOTS.custom_upsell).toBe(20);
    });
  });

  describe("getPlanById", () => {
    it("returns plan for valid ID", () => {
      const plan = getPlanById("basic");
      expect(plan).toBeDefined();
      expect(plan?.id).toBe("basic");
    });

    it("returns undefined for invalid ID", () => {
      const plan = getPlanById("invalid" as PlanId);
      expect(plan).toBeUndefined();
    });

    it("returns all valid plans", () => {
      const planIds: PlanId[] = ["basic", "pro", "executive"];
      planIds.forEach((id) => {
        const plan = getPlanById(id);
        expect(plan).toBeDefined();
        expect(plan?.id).toBe(id);
      });
    });
  });

  describe("isValidTransition", () => {
    it("allows same status transition", () => {
      expect(isValidTransition("pending", "pending")).toBe(true);
      expect(isValidTransition("completed", "completed")).toBe(true);
    });

    it("allows forward transitions in lifecycle", () => {
      expect(isValidTransition("pending", "paid")).toBe(true);
      expect(isValidTransition("paid", "training")).toBe(true);
      expect(isValidTransition("training", "generating")).toBe(true);
      expect(isValidTransition("generating", "completed")).toBe(true);
    });

    it("allows transition to failed from any non-terminal state", () => {
      expect(isValidTransition("pending", "failed")).toBe(true);
      expect(isValidTransition("paid", "failed")).toBe(true);
      expect(isValidTransition("training", "failed")).toBe(true);
      expect(isValidTransition("generating", "failed")).toBe(true);
    });

    it("allows transition to refunded from any non-terminal state", () => {
      expect(isValidTransition("pending", "refunded")).toBe(true);
      expect(isValidTransition("paid", "refunded")).toBe(true);
      expect(isValidTransition("training", "refunded")).toBe(true);
      expect(isValidTransition("generating", "refunded")).toBe(true);
    });

    it("prevents backward transitions", () => {
      expect(isValidTransition("paid", "pending")).toBe(false);
      expect(isValidTransition("training", "paid")).toBe(false);
      expect(isValidTransition("generating", "training")).toBe(false);
      expect(isValidTransition("completed", "generating")).toBe(false);
    });

    it("prevents transitions from terminal states", () => {
      expect(isValidTransition("completed", "generating")).toBe(false);
      expect(isValidTransition("completed", "failed")).toBe(false);
      expect(isValidTransition("failed", "training")).toBe(false);
      expect(isValidTransition("refunded", "paid")).toBe(false);
    });

    it("prevents transitions to non-existent statuses", () => {
      expect(isValidTransition("pending", "invalid")).toBe(false);
      expect(isValidTransition("invalid", "paid")).toBe(false);
    });

    it("allows skipping forward in lifecycle", () => {
      expect(isValidTransition("pending", "training")).toBe(true);
      expect(isValidTransition("paid", "generating")).toBe(true);
      expect(isValidTransition("training", "completed")).toBe(true);
    });
  });
});
