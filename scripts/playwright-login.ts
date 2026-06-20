#!/usr/bin/env npx tsx
/**
 * Playwright Login Script - Run once to authenticate Instagram & TikTok
 * Saves session cookies to ./playwright-session/
 *
 * Usage: npx tsx scripts/playwright-login.ts
 */

import { chromium, type BrowserContext } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = path.join(process.cwd(), "playwright-session");
const PLATFORMS = ["instagram", "tiktok"] as const;

async function loginPlatform(
  context: BrowserContext,
  platform: (typeof PLATFORMS)[number],
) {
  const page = await context.newPage();

  const urls = {
    instagram: "https://www.instagram.com/accounts/login/",
    tiktok: "https://www.tiktok.com/login",
  };

  console.log(`\n🌐 Opening ${platform} login page...`);
  await page.goto(urls[platform], { waitUntil: "networkidle" });

  console.log(`📝 Please log into ${platform} manually in the browser window.`);
  console.log(`   - Complete any 2FA if prompted`);
  console.log(
    `   - Dismiss "Save login info" / "Turn on notifications" popups`,
  );
  console.log(`   - Wait until you see your feed/profile page`);

  // Wait for successful login - check for feed elements
  const selectors = {
    instagram: [
      '[aria-label="Home"]',
      'nav[role="navigation"]',
      'svg[aria-label="Home"]',
    ],
    tiktok: ['[data-e2e="nav-home"]', ".tiktok-nav-bar", '[aria-label="Home"]'],
  };

  let loggedIn = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    await page.waitForTimeout(5000);
    for (const sel of selectors[platform]) {
      if (
        await page
          .locator(sel)
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        loggedIn = true;
        break;
      }
    }
    if (loggedIn) break;
    console.log(`   ⏳ Waiting for login... (${attempt + 1}/30)`);
  }

  if (!loggedIn) {
    console.log(
      `⚠️  Could not auto-detect login. Assuming success if you see your feed.`,
    );
  } else {
    console.log(`✅ ${platform} login detected!`);
  }

  await page.close();
}

async function main() {
  console.log("🔐 Truzot Social Login Session Creator");
  console.log("=====================================\n");

  // Create session directory
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  // Launch persistent context (saves cookies automatically)
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false, // Must be visible for manual login
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  // Add stealth scripts
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  try {
    for (const platform of PLATFORMS) {
      await loginPlatform(context, platform);
    }

    console.log(`\n✅ All done! Session saved to: ${SESSION_DIR}`);
    console.log(
      `   You can now run discovery scripts that reuse this session.`,
    );
  } finally {
    await context.close();
  }
}

main().catch(console.error);
