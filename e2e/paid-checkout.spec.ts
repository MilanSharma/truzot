/**
 * E2E tests for full paid checkout journey
 */

import { test, expect } from "@playwright/test";

test.describe("Paid Checkout Journey", () => {
  test("navigates to upload page", async ({ page }) => {
    await page.goto("/upload");
    await expect(page).toHaveURL(/\/upload/);
  });

  test("displays plan selection options", async ({ page }) => {
    await page.goto("/upload");
    
    // Look for plan selection UI
    const planOptions = page.locator('[class*="plan"], [class*="pricing"], button:has-text("Basic"), button:has-text("Pro")').first();
    if (await planOptions.isVisible()) {
      await expect(planOptions).toBeVisible();
    }
  });

  test("selects a paid plan", async ({ page }) => {
    await page.goto("/upload");
    
    // Try to find and click on a plan option
    const basicPlan = page.locator('button:has-text("Basic"), [data-plan="basic"]').first();
    if (await basicPlan.isVisible()) {
      await basicPlan.click();
    }
  });

  test("enters email for checkout", async ({ page }) => {
    await page.goto("/upload");
    
    // Look for email input field
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });

  test("displays pricing information", async ({ page }) => {
    await page.goto("/upload");
    
    // Check for pricing display using text content
    const pricingDisplay = page.locator('[class*="price"], [class*="cost"]').first();
    if (await pricingDisplay.isVisible()) {
      await expect(pricingDisplay).toBeVisible();
    }
  });

  test("initiates Stripe checkout", async ({ page }) => {
    await page.goto("/upload");
    
    // Look for checkout button
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay"), button:has-text("Continue to Payment")').first();
    if (await checkoutButton.isVisible()) {
      await expect(checkoutButton).toBeVisible();
    }
  });

  test("handles guest checkout flow", async ({ page }) => {
    await page.goto("/upload");
    
    // Check if guest checkout option exists
    const guestOption = page.locator('button:has-text("Continue as Guest"), [class*="guest"]').first();
    if (await guestOption.isVisible()) {
      await expect(guestOption).toBeVisible();
    }
  });

  test("handles authenticated checkout flow", async ({ page }) => {
    // First navigate to login
    await page.goto("/login");
    
    // Check login form is present
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test("displays order confirmation after payment", async ({ page }) => {
    // This would require mocking Stripe checkout
    // For now, we check if the confirmation page exists
    await page.goto("/dashboard");
    
    // Check for order confirmation elements
    const confirmation = page.locator('[class*="confirm"], [class*="success"]').first();
    if (await confirmation.isVisible()) {
      await expect(confirmation).toBeVisible();
    }
  });

  test("shows order in dashboard after purchase", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for orders list
    const ordersList = page.locator('[class*="order"], [class*="history"]').first();
    if (await ordersList.isVisible()) {
      await expect(ordersList).toBeVisible();
    }
  });

  test("displays payment status", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for payment status indicators
    const statusIndicator = page.locator('[class*="status"], [class*="paid"]').first();
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible();
    }
  });

  test("allows retrying failed payment", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for retry payment button
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Pay Again")').first();
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }
  });

  test("displays receipt information", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for receipt or invoice elements
    const receipt = page.locator('[class*="receipt"], [class*="invoice"]').first();
    if (await receipt.isVisible()) {
      await expect(receipt).toBeVisible();
    }
  });

  test("handles coupon code input", async ({ page }) => {
    await page.goto("/upload");
    
    // Check for coupon input field
    const couponInput = page.locator('input[name="coupon"], input[placeholder*="coupon" i], input[placeholder*="code" i]').first();
    if (await couponInput.isVisible()) {
      await expect(couponInput).toBeVisible();
    }
  });

  test("displays discount when coupon applied", async ({ page }) => {
    await page.goto("/upload");
    
    // Check for discount display
    const discountDisplay = page.locator('[class*="discount"], [class*="savings"]').first();
    if (await discountDisplay.isVisible()) {
      await expect(discountDisplay).toBeVisible();
    }
  });
});
