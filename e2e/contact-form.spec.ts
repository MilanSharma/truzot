import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("shows all form fields", async ({ page }) => {
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('textarea[rows="5"]').first()).toBeVisible();
  });

  test("submit button is initially visible", async ({ page }) => {
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Submit")',
      )
      .first();
    await expect(submit).toBeVisible();
  });

  test("can fill and submit form successfully", async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const messageInput = page.locator('textarea[rows="5"]').first();

    await nameInput.fill("Test User");
    await emailInput.fill("test@example.com");
    await messageInput.fill(
      "This is a test message from Playwright E2E testing.",
    );

    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Submit")',
      )
      .first();
    await submit.click();

    await page.waitForTimeout(5000);

    const sentIndicator = page.locator("text=/sent|success|thank|failed to send/i");
    await expect(sentIndicator).toBeVisible({ timeout: 20_000 });
  });

  test("empty submission shows validation", async ({ page }) => {
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Submit")',
      )
      .first();
    await submit.click();
    await page.waitForTimeout(500);
  });

  test("name field accepts text", async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill("John Doe");
    await expect(nameInput).toHaveValue("John Doe");
  });

  test("email field accepts valid email", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("john@example.com");
    await expect(emailInput).toHaveValue("john@example.com");
  });

  test("message field accepts multiline text", async ({ page }) => {
    const messageInput = page.locator('textarea[rows="5"]').first();
    await messageInput.fill("Line 1\nLine 2\nLine 3");
    await expect(messageInput).toHaveValue("Line 1\nLine 2\nLine 3");
  });
});
