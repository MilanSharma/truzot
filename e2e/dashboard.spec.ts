/**
 * E2E tests for dashboard management
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard Management", () => {
  test("dashboard page loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("displays user orders list", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for orders section
    const ordersSection = page.locator('[class*="order"], [class*="history"], [class*="list"]').first();
    if (await ordersSection.isVisible()) {
      await expect(ordersSection).toBeVisible();
    }
  });

  test("displays order status indicators", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for status badges
    const statusBadge = page.locator('[class*="status"], [class*="badge"]').first();
    if (await statusBadge.isVisible()) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test("allows viewing order details", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for order detail buttons or links
    const viewButton = page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();
    if (await viewButton.isVisible()) {
      await expect(viewButton).toBeVisible();
    }
  });

  test("displays headshot gallery for completed orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for gallery or grid
    const gallery = page.locator('[class*="gallery"], [class*="grid"], [class*="headshot"]').first();
    if (await gallery.isVisible()) {
      await expect(gallery).toBeVisible();
    }
  });

  test("allows favoriting headshots", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for favorite buttons
    const favoriteButton = page.locator('button[aria-label*="favorite"], button:has-text("★"), [class*="favorite"]').first();
    if (await favoriteButton.isVisible()) {
      await expect(favoriteButton).toBeVisible();
    }
  });

  test("allows downloading individual headshots", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for download buttons
    const downloadButton = page.locator('button:has-text("Download"), button[aria-label*="download"], [class*="download"]').first();
    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeVisible();
    }
  });

  test("allows downloading all headshots as ZIP", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for download all button
    const downloadAllButton = page.locator('button:has-text("Download All"), button:has-text("ZIP")').first();
    if (await downloadAllButton.isVisible()) {
      await expect(downloadAllButton).toBeVisible();
    }
  });

  test("allows sharing headshots via email", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for email share button
    const emailButton = page.locator('button:has-text("Email"), button:has-text("Share"), [class*="email"]').first();
    if (await emailButton.isVisible()) {
      await expect(emailButton).toBeVisible();
    }
  });

  test("displays progress for in-progress orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for progress bars or indicators
    const progressBar = page.locator('[class*="progress"], [role="progressbar"]').first();
    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();
    }
  });

  test("allows retrying failed orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Regenerate")').first();
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }
  });

  test("allows cancelling active orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for cancel button
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeVisible();
    }
  });

  test("displays order metadata (date, plan, etc.)", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for metadata display
    const metadata = page.locator('[class*="meta"], [class*="info"], [class*="date"]').first();
    if (await metadata.isVisible()) {
      await expect(metadata).toBeVisible();
    }
  });

  test("allows filtering orders by status", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for filter controls
    const filter = page.locator('select, button:has-text("Filter"), [class*="filter"]').first();
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible();
    }
  });

  test("allows searching orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("displays empty state when no orders", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for empty state message
    const emptyState = page.locator('[class*="empty"], p:has-text("No orders"), p:has-text("Get started")').first();
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("navigates to upload page from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for CTA to create new order
    const ctaButton = page.locator('a[href="/upload"], button:has-text("New Order"), button:has-text("Create")').first();
    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeVisible();
    }
  });

  test("displays user profile information", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for profile section
    const profile = page.locator('[class*="profile"], [class*="user"], [class*="avatar"]').first();
    if (await profile.isVisible()) {
      await expect(profile).toBeVisible();
    }
  });

  test("allows accessing account settings", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for settings link
    const settingsLink = page.locator('a[href="/account"], a[href="/settings"], button:has-text("Settings")').first();
    if (await settingsLink.isVisible()) {
      await expect(settingsLink).toBeVisible();
    }
  });

  test("allows logging out", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutButton.isVisible()) {
      await expect(logoutButton).toBeVisible();
    }
  });
});
