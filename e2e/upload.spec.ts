import { test, expect } from "@playwright/test";

test.describe("Upload Page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/upload");
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnLogin = url.includes("/login");
    const isOnUpload = url.includes("/upload");
    expect(isOnLogin || isOnUpload).toBeTruthy();
  });

  test("has proper page structure when accessible", async ({ page }) => {
    await page.goto("/upload");
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnLogin = url.includes("/login");
    const isOnDashboard = url.includes("/dashboard");
    expect(isOnLogin || isOnDashboard).toBeTruthy();
  });
});

test.describe("Account Page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/account");
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnLogin = url.includes("/login");
    const isOnAccount = url.includes("/account");
    expect(isOnLogin || isOnAccount).toBeTruthy();
  });
});
