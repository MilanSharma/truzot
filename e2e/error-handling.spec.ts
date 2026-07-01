import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("404 page returns correct status", async ({ page }) => {
    const response = await page.goto("/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });

  test("404 page shows user-friendly message", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    const notFound = page.locator("text=/not found|404|page.*exist/i").first();
    await expect(notFound).toBeVisible();
  });

  test("404 page has link back to home", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    const homeLink = page.locator('a[href="/"]');
    const count = await homeLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("API health endpoint responds", async ({ page }) => {
    const response = await page.goto("/api/health");
    expect([200, 503, 404]).toContain(response?.status());
    const body = await response?.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
  });

  test("sitemap is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });
});
