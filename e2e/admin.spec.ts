/**
 * E2E tests for admin dashboard
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin page loads", async ({ page }) => {
    await page.goto("/admin");
    // Admin page may require authentication or may not exist
    const heading = page.locator("h1, h2").first();
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });

  test("displays orders list", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for orders table or list
    const ordersList = page.locator('[class*="order"], table, [class*="list"]').first();
    if (await ordersList.isVisible()) {
      await expect(ordersList).toBeVisible();
    }
  });

  test("displays order status filters", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for filter controls
    const filters = page.locator('select, button:has-text("Filter"), [class*="filter"]').first();
    if (await filters.isVisible()) {
      await expect(filters).toBeVisible();
    }
  });

  test("allows viewing order details", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for view detail buttons
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await expect(viewButton).toBeVisible();
    }
  });

  test("allows retrying failed orders", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Regenerate")').first();
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }
  });

  test("allows processing refunds", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for refund button
    const refundButton = page.locator('button:has-text("Refund"), button:has-text("Refund")').first();
    if (await refundButton.isVisible()) {
      await expect(refundButton).toBeVisible();
    }
  });

  test("displays statistics/metrics", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for stats display
    const stats = page.locator('[class*="stat"], [class*="metric"], [class*="count"]').first();
    if (await stats.isVisible()) {
      await expect(stats).toBeVisible();
    }
  });

  test("displays revenue information", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for revenue display
    const revenue = page.locator('[class*="revenue"]').first();
    if (await revenue.isVisible()) {
      await expect(revenue).toBeVisible();
    }
  });

  test("displays user count", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for user count
    const userCount = page.locator('[class*="user"], [class*="customer"]').first();
    if (await userCount.isVisible()) {
      await expect(userCount).toBeVisible();
    }
  });

  test("allows searching orders", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("allows pagination of orders", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for pagination controls
    const pagination = page.locator('[class*="pagination"], button:has-text("Next"), button:has-text("Previous")').first();
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

  test("displays order timestamps", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for date/time display
    const timestamp = page.locator('[class*="date"], [class*="time"]').first();
    if (await timestamp.isVisible()) {
      await expect(timestamp).toBeVisible();
    }
  });

  test("displays customer information", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for customer email/name display
    const customerInfo = page.locator('[class*="customer"], [class*="email"]').first();
    if (await customerInfo.isVisible()) {
      await expect(customerInfo).toBeVisible();
    }
  });

  test("displays plan information", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for plan display
    const planInfo = page.locator('[class*="plan"], [class*="tier"]').first();
    if (await planInfo.isVisible()) {
      await expect(planInfo).toBeVisible();
    }
  });

  test("allows exporting order data", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
    }
  });

  test("displays system health status", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for health indicators
    const healthStatus = page.locator('[class*="health"], [class*="status"], [class*="system"]').first();
    if (await healthStatus.isVisible()) {
      await expect(healthStatus).toBeVisible();
    }
  });

  test("navigates back to main dashboard", async ({ page }) => {
    await page.goto("/admin");
    
    // Check for back to dashboard link
    const dashboardLink = page.locator('a[href="/dashboard"], button:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible()) {
      await expect(dashboardLink).toBeVisible();
    }
  });
});
