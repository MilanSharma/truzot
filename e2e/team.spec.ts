import { test, expect } from "@playwright/test";

test.describe("Team Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/team");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("shows team features info", async ({ page }) => {
    await page.goto("/team");
    await page.waitForTimeout(1000);
    const content = page.locator("body");
    await expect(content).toContainText(/team|collaborate|workspace/i);
  });
});

test.describe("Unsubscribe Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/unsubscribe");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Claim Order Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/claim-order");
    await expect(page.locator("body")).toBeVisible();
  });
});
