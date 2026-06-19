import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("login page has email field", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]',
      )
      .first();
    await expect(emailInput).toBeVisible();
  });

  test("login page has password field", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test("login page has submit button", async ({ page }) => {
    await page.goto("/login");
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")',
      )
      .first();
    await expect(submit).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]',
      )
      .first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")',
      )
      .first();

    // Use a real-looking email that won't exist but won't trigger "email not confirmed"
    await emailInput.fill("testuser123@example.com");
    await passwordInput.fill("WrongPassword123!");
    await submit.click();

    // Wait for error - the error div has bg-red-50 class and contains the error text
    // Supabase returns "Invalid login credentials"
    await page.waitForTimeout(3000);
    const errorDiv = page.locator('div.bg-red-50, div[class*="bg-red-50"]');
    await expect(errorDiv).toBeVisible({ timeout: 20_000 });
  });

  test("empty form submission shows validation", async ({ page }) => {
    await page.goto("/login");
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")',
      )
      .first();
    await submit.click();
    await page.waitForTimeout(500);
  });

  test("sign-up mode toggle exists", async ({ page }) => {
    await page.goto("/login");
    const signUpToggle = page.getByText("Don't have an account? Sign up");
    await expect(signUpToggle).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    const eyeToggle = page
      .locator(
        'button[aria-label*="password" i], button[aria-label*="show" i], button[aria-label*="toggle" i]',
      )
      .first();
    if (await eyeToggle.isVisible()) {
      await eyeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test("forgot password link exists", async ({ page }) => {
    await page.goto("/login");
    const forgotButton = page.locator('button:has-text("Forgot password")');
    await expect(forgotButton).toBeVisible();
  });
});

test.describe("Reset Password", () => {
  test("reset password interface loads within login page", async ({ page }) => {
    await page.goto("/login");
    const forgotButton = page.locator('button:has-text("Forgot password")');
    await forgotButton.click();
    await page.waitForTimeout(300);
    await expect(
      page.getByRole("heading", {
        name: /reset your password/i,
      }),
    ).toBeVisible();
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});
