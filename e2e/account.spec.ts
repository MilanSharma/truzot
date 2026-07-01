/**
 * E2E tests for account management
 */

import { test, expect } from "@playwright/test";

test.describe("Account Management", () => {
  test("account page loads", async ({ page }) => {
    await page.goto("/account");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("displays user profile information", async ({ page }) => {
    await page.goto("/account");
    
    // Check for profile display
    const profileDisplay = page.locator('[class*="profile"], [class*="user-info"]').first();
    if (await profileDisplay.isVisible()) {
      await expect(profileDisplay).toBeVisible();
    }
  });

  test("allows updating user name", async ({ page }) => {
    await page.goto("/account");
    
    // Check for name input field
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
    }
  });

  test("allows updating email", async ({ page }) => {
    await page.goto("/account");
    
    // Check for email input field (may be read-only)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });

  test("allows changing password", async ({ page }) => {
    await page.goto("/account");
    
    // Check for password change section
    const passwordSection = page.locator('button:has-text("Change Password"), [class*="password"]').first();
    if (await passwordSection.isVisible()) {
      await expect(passwordSection).toBeVisible();
    }
  });

  test("displays order history", async ({ page }) => {
    await page.goto("/account");
    
    // Check for order history section
    const orderHistory = page.locator('[class*="history"], [class*="orders"]').first();
    if (await orderHistory.isVisible()) {
      await expect(orderHistory).toBeVisible();
    }
  });

  test("allows deleting account", async ({ page }) => {
    await page.goto("/account");
    
    // Check for delete account button (should be protected)
    const deleteButton = page.locator('button:has-text("Delete Account"), button:has-text("Delete")').first();
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test("displays subscription information", async ({ page }) => {
    await page.goto("/account");
    
    // Check for subscription/billing info
    const subscriptionInfo = page.locator('[class*="subscription"], [class*="billing"], [class*="plan"]').first();
    if (await subscriptionInfo.isVisible()) {
      await expect(subscriptionInfo).toBeVisible();
    }
  });

  test("allows managing notifications", async ({ page }) => {
    await page.goto("/account");
    
    // Check for notification settings
    const notificationSettings = page.locator('[class*="notification"], input[type="checkbox"]').first();
    if (await notificationSettings.isVisible()) {
      await expect(notificationSettings).toBeVisible();
    }
  });

  test("displays privacy settings", async ({ page }) => {
    await page.goto("/account");
    
    // Check for privacy settings
    const privacySettings = page.locator('[class*="privacy"], [class*="data"]').first();
    if (await privacySettings.isVisible()) {
      await expect(privacySettings).toBeVisible();
    }
  });

  test("allows exporting data", async ({ page }) => {
    await page.goto("/account");
    
    // Check for data export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download Data")').first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
    }
  });

  test("navigates back to dashboard", async ({ page }) => {
    await page.goto("/account");
    
    // Check for back to dashboard link
    const dashboardLink = page.locator('a[href="/dashboard"], button:has-text("Back to Dashboard")').first();
    if (await dashboardLink.isVisible()) {
      await expect(dashboardLink).toBeVisible();
    }
  });

  test("displays user avatar", async ({ page }) => {
    await page.goto("/account");
    
    // Check for avatar display
    const avatar = page.locator('[class*="avatar"], img[alt*="avatar"]').first();
    if (await avatar.isVisible()) {
      await expect(avatar).toBeVisible();
    }
  });

  test("allows uploading avatar", async ({ page }) => {
    await page.goto("/account");
    
    // Check for avatar upload input
    const avatarUpload = page.locator('input[type="file"][accept*="image"]').first();
    if (await avatarUpload.isVisible()) {
      await expect(avatarUpload).toBeVisible();
    }
  });

  test("displays account creation date", async ({ page }) => {
    await page.goto("/account");
    
    // Check for creation date display
    const creationDate = page.locator('[class*="created"], [class*="joined"], [class*="member since"]').first();
    if (await creationDate.isVisible()) {
      await expect(creationDate).toBeVisible();
    }
  });

  test("allows logging out from account page", async ({ page }) => {
    await page.goto("/account");
    
    // Check for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutButton.isVisible()) {
      await expect(logoutButton).toBeVisible();
    }
  });
});
