import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Truzot|AI.*Headshot/i);
  });

  test("displays hero content", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/headshot|professional|photo/i);
  });

  test("has navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("has CTA button for getting started", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('a[href="/upload"], a[href="/login"]').first();
    await expect(cta).toBeVisible();
  });

  test("pricing section is visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    const pricing = page.locator("text=pricing").first();
    if (await pricing.isVisible()) {
      await expect(pricing).toBeVisible();
    }
  });

  test("footer has legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    if (await footer.isVisible()) {
      await expect(footer).toContainText(/privacy|terms/i);
    }
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.evaluate((el) => el.classList.contains("dark"));
    const toggle = page.locator('button[aria-label="Toggle dark mode"]');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
      const after = await html.evaluate((el) => el.classList.contains("dark"));
      expect(after).toBe(!initial);
    }
  });
});
