#!/usr/bin/env npx tsx
/**
 * Playwright Discovery Script - Find influencer candidates on Instagram & TikTok
 * Reuses saved session from playwright-login.ts
 *
 * Usage: npx tsx scripts/playwright-discover.ts
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = path.join(process.cwd(), "playwright-session");
const OUTPUT_FILE = path.join(
  process.cwd(),
  "data",
  "influencer-candidates.json",
);

interface Candidate {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  bio?: string;
  profileUrl: string;
  recentPosts: Array<{
    url: string;
    caption?: string;
    likes?: number;
    comments?: number;
    date?: string;
    mediaType: "image" | "video" | "carousel";
  }>;
  nicheGuess: string;
  emailAvailable: boolean;
  discoveredAt: string;
  status: "new" | "warming" | "dmed" | "replied" | "skipped";
}

const SEARCH_CONFIG = {
  instagram: {
    baseUrl: "https://www.instagram.com",
    searchQueries: [
      "headshot photographer",
      "professional photographer",
      "portrait photographer",
      "LinkedIn tips",
      "career coach",
      "job search",
      "resume tips",
      "personal branding",
      "AI tools",
      "AI for business",
      "AI productivity",
      "real estate agent tips",
      "entrepreneur tips",
      "solo founder",
      "small business coach",
    ],
    selectors: {
      profileLink: 'a[href^="/"]',
      followerCount: 'span:has-text("followers")',
      postLinks: 'a[href*="/p/"]',
    },
  },
  tiktok: {
    baseUrl: "https://www.tiktok.com",
    searchQueries: [
      "headshot photographer",
      "professional photographer",
      "LinkedIn tips",
      "career coach",
      "job search",
      "personal branding",
      "AI tools",
      "AI productivity",
      "real estate agent",
      "entrepreneur tips",
      "small business coach",
    ],
    selectors: {
      profileLink: 'a[href^="/@"]',
      followerCount: 'strong[data-e2e="followers-count"]',
      postLinks: 'a[href*="/video/"]',
    },
  },
};

const FOLLOWER_RANGE = { min: 5000, max: 100000 };
const MAX_CANDIDATES_PER_DAY = 40;

async function randomDelay(minMs = 2000, maxMs = 6000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((r) => setTimeout(r, delay));
}

async function parseFollowerCount(text: string): Promise<number> {
  const cleaned = text.replace(/[^\d.kKmM]/g, "").toLowerCase();
  if (cleaned.includes("k")) return Math.round(parseFloat(cleaned) * 1000);
  if (cleaned.includes("m")) return Math.round(parseFloat(cleaned) * 1000000);
  return parseInt(cleaned) || 0;
}

async function discoverOnPlatform(
  context: BrowserContext,
  platform: "instagram" | "tiktok",
): Promise<Candidate[]> {
  const config = SEARCH_CONFIG[platform];
  const candidates: Candidate[] = [];
  const seenHandles = new Set<string>();

  for (const query of config.searchQueries) {
    if (candidates.length >= MAX_CANDIDATES_PER_DAY) break;

    console.log(`\n🔍 ${platform}: Searching "${query}"...`);
    const page = await context.newPage();

    try {
      // Search
      const searchUrl =
        platform === "instagram"
          ? `${config.baseUrl}/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ""))}/`
          : `${config.baseUrl}/search?q=${encodeURIComponent(query)}&t=${Date.now()}`;

      await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });
      await randomDelay(3000, 5000);

      // Scroll to load more profiles
      for (let scroll = 0; scroll < 5; scroll++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await randomDelay(1000, 2000);
      }

      // Extract profile links
      const profileLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a[href]"));
        return links
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(
            (href) => href.includes("/@") || href.match(/\/(p|reel|video)\//),
          );
      });

      // Deduplicate and limit
      const uniqueProfiles = [...new Set(profileLinks)].slice(0, 20);

      for (const profileUrl of uniqueProfiles) {
        if (candidates.length >= MAX_CANDIDATES_PER_DAY) break;

        const handleMatch = profileUrl.match(/\/@?([^/?]+)/);
        if (!handleMatch) continue;
        const handle = handleMatch[1].toLowerCase();

        if (seenHandles.has(handle)) continue;
        seenHandles.add(handle);

        // Check profile
        const candidate = await scrapeProfile(
          page,
          platform,
          handle,
          profileUrl,
          query,
        );
        if (candidate) {
          candidates.push(candidate);
          console.log(
            `   ✅ Found: @${handle} (${candidate.followerCount?.toLocaleString()} followers)`,
          );
        }

        await randomDelay(2000, 4000);
      }
    } catch (e) {
      console.log(`   ⚠️ Error searching "${query}": ${e}`);
    } finally {
      await page.close();
    }
  }

  return candidates;
}

async function scrapeProfile(
  page: Page,
  platform: "instagram" | "tiktok",
  handle: string,
  profileUrl: string,
  searchQuery: string,
): Promise<Candidate | null> {
  try {
    await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 30000 });
    await randomDelay(2000, 3000);

    // Extract basic info
    const [
      followerCount,
      followingCount,
      postCount,
      bio,
      displayName,
      emailAvailable,
    ] = await Promise.all([
      extractFollowers(page, platform),
      extractFollowing(page, platform),
      extractPostCount(page, platform),
      extractBio(page, platform),
      extractDisplayName(page, platform),
      checkEmailInBio(page, platform),
    ]);

    // Filter by follower count
    if (
      followerCount &&
      (followerCount < FOLLOWER_RANGE.min || followerCount > FOLLOWER_RANGE.max)
    ) {
      console.log(
        `   ⏭️ @${handle}: ${followerCount.toLocaleString()} followers (outside range)`,
      );
      return null;
    }

    // Get recent posts
    const recentPosts = await extractRecentPosts(page, platform, handle);

    // Check recent activity (at least 3 posts in 30 days)
    const recentPosts30d = recentPosts.filter((p) => {
      if (!p.date) return false;
      const daysAgo =
        (Date.now() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    if (recentPosts30d.length < 3) {
      console.log(
        `   ⏭️ @${handle}: Only ${recentPosts30d.length} posts in 30 days`,
      );
      return null;
    }

    // Determine niche from search query + bio
    const nicheGuess = categorizeNiche(searchQuery, bio || "");

    return {
      handle,
      platform,
      displayName,
      followerCount,
      followingCount,
      postCount,
      bio,
      profileUrl,
      recentPosts: recentPosts.slice(0, 5),
      nicheGuess,
      emailAvailable,
      discoveredAt: new Date().toISOString(),
      status: "new",
    };
  } catch (e) {
    console.log(`   ⚠️ Error scraping @${handle}: ${e}`);
    return null;
  }
}

async function extractFollowers(
  page: Page,
  platform: string,
): Promise<number | undefined> {
  try {
    if (platform === "instagram") {
      const text = await page
        .locator('span:has-text("followers")')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    } else {
      const text = await page
        .locator('strong[data-e2e="followers-count"]')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    }
  } catch {
    return undefined;
  }
}

async function extractFollowing(
  page: Page,
  platform: string,
): Promise<number | undefined> {
  try {
    if (platform === "instagram") {
      const text = await page
        .locator('span:has-text("following")')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    } else {
      const text = await page
        .locator('strong[data-e2e="following-count"]')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    }
  } catch {
    return undefined;
  }
}

async function extractPostCount(
  page: Page,
  platform: string,
): Promise<number | undefined> {
  try {
    if (platform === "instagram") {
      const text = await page
        .locator('span:has-text("posts")')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    } else {
      const text = await page
        .locator('strong[data-e2e="video-count"]')
        .first()
        .textContent({ timeout: 5000 });
      return text ? parseFollowerCount(text) : undefined;
    }
  } catch {
    return undefined;
  }
}

async function extractBio(
  page: Page,
  platform: string,
): Promise<string | undefined> {
  try {
    if (platform === "instagram") {
      return (
        (await page
          .locator("section header + div, header + div")
          .first()
          .textContent({ timeout: 5000 })) ?? undefined
      );
    } else {
      return (
        (await page
          .locator('[data-e2e="user-bio"]')
          .first()
          .textContent({ timeout: 5000 })) ?? undefined
      );
    }
  } catch {
    return undefined;
  }
}

async function extractDisplayName(
  page: Page,
  platform: string,
): Promise<string | undefined> {
  try {
    if (platform === "instagram") {
      return (
        (await page
          .locator("header h2, header h1")
          .first()
          .textContent({ timeout: 5000 })) ?? undefined
      );
    } else {
      return (
        (await page
          .locator('[data-e2e="user-title"]')
          .first()
          .textContent({ timeout: 5000 })) ?? undefined
      );
    }
  } catch {
    return undefined;
  }
}

async function checkEmailInBio(page: Page, platform: string): Promise<boolean> {
  try {
    const bio = await extractBio(page, platform);
    return bio ? /@[\w.-]+\.\w+/.test(bio) : false;
  } catch {
    return false;
  }
}

async function extractRecentPosts(
  page: Page,
  platform: string,
  handle: string,
) {
  const posts = [];

  try {
    const postLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      return links
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => {
          if (platform === "instagram")
            return href.includes("/p/") || href.includes("/reel/");
          return href.includes("/video/");
        })
        .slice(0, 10);
    });

    for (const postUrl of postLinks.slice(0, 5)) {
      try {
        await page.goto(postUrl, { waitUntil: "networkidle", timeout: 20000 });
        await randomDelay(1000, 2000);

        const [caption, likes, comments, date, mediaType] = await Promise.all([
          extractCaption(page, platform),
          extractLikes(page, platform),
          extractComments(page, platform),
          extractPostDate(page, platform),
          detectMediaType(page),
        ]);

        posts.push({ url: postUrl, caption, likes, comments, date, mediaType });
        await randomDelay(1000, 2000);
      } catch (e) {
        console.log(`      ⚠️ Failed to scrape post: ${e}`);
      }
    }
  } catch (e) {
    console.log(`      ⚠️ Failed to extract posts: ${e}`);
  }

  return posts;
}

async function extractCaption(
  page: Page,
  platform: string,
): Promise<string | undefined> {
  try {
    if (platform === "instagram") {
      return (
        (await page
          .locator("article header + div span, article h1")
          .first()
          .textContent({ timeout: 3000 })) ?? undefined
      );
    } else {
      return (
        (await page
          .locator('[data-e2e="video-desc"], .video-info-detail')
          .first()
          .textContent({ timeout: 3000 })) ?? undefined
      );
    }
  } catch {
    return undefined;
  }
}

async function extractLikes(
  page: Page,
  platform: string,
): Promise<number | undefined> {
  try {
    if (platform === "instagram") {
      const text = await page
        .locator(
          'section span:has-text("likes"), section button:has-text("like")',
        )
        .first()
        .textContent({ timeout: 3000 });
      return text ? parseFollowerCount(text) : undefined;
    } else {
      const text = await page
        .locator('[data-e2e="like-count"]')
        .first()
        .textContent({ timeout: 3000 });
      return text ? parseFollowerCount(text) : undefined;
    }
  } catch {
    return undefined;
  }
}

async function extractComments(
  page: Page,
  platform: string,
): Promise<number | undefined> {
  try {
    if (platform === "instagram") {
      const text = await page
        .locator('section span:has-text("comments")')
        .first()
        .textContent({ timeout: 3000 });
      return text ? parseFollowerCount(text) : undefined;
    } else {
      const text = await page
        .locator('[data-e2e="comment-count"]')
        .first()
        .textContent({ timeout: 3000 });
      return text ? parseFollowerCount(text) : undefined;
    }
  } catch {
    return undefined;
  }
}

async function extractPostDate(
  page: Page,
  platform: string,
): Promise<string | undefined> {
  try {
    if (platform === "instagram") {
      const timeEl = await page.locator("time").first();
      return (await timeEl.getAttribute("datetime")) ?? undefined;
    } else {
      const timeEl = await page.locator('[data-e2e="video-time"]').first();
      return (
        (await timeEl.getAttribute("datetime")) ??
        (await timeEl.textContent({ timeout: 3000 })) ??
        undefined
      );
    }
  } catch {
    return undefined;
  }
}

async function detectMediaType(
  page: Page,
): Promise<"image" | "video" | "carousel"> {
  try {
    const video = await page
      .locator("video")
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (video) return "video";
    const carousel = await page
      .locator('[aria-label="Next"], button:has(svg[aria-label="Next"])')
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    return carousel ? "carousel" : "image";
  } catch {
    return "image";
  }
}

function categorizeNiche(query: string, bio: string): string {
  const text = (query + " " + (bio || "")).toLowerCase();
  if (
    text.includes("headshot") ||
    text.includes("portrait") ||
    text.includes("photographer")
  )
    return "photography/headshots";
  if (
    text.includes("linkedin") ||
    text.includes("career") ||
    text.includes("job search") ||
    text.includes("resume")
  )
    return "career/linkedin";
  if (text.includes("personal brand") || text.includes("branding"))
    return "personal branding";
  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("productivity")
  )
    return "ai/tools";
  if (text.includes("real estate") || text.includes("realtor"))
    return "real estate";
  if (
    text.includes("entrepreneur") ||
    text.includes("founder") ||
    text.includes("business coach")
  )
    return "entrepreneurship";
  return "general";
}

async function loadExistingCandidates(): Promise<Candidate[]> {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

async function saveCandidates(candidates: Candidate[]) {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(candidates, null, 2));
  console.log(`\n💾 Saved ${candidates.length} candidates to ${OUTPUT_FILE}`);
}

async function main() {
  console.log("🔍 Truzot Influencer Discovery");
  console.log("===============================\n");

  // Load existing
  const existing = await loadExistingCandidates();
  console.log(`📋 Loaded ${existing.length} existing candidates`);

  // Launch with saved session
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: { width: 1280, height: 720 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  // Stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  try {
    const allCandidates = [...existing];
    const existingHandles = new Set(
      existing.map((c) => c.handle.toLowerCase()),
    );

    for (const platform of ["instagram", "tiktok"] as const) {
      const newCandidates = await discoverOnPlatform(context, platform);

      for (const c of newCandidates) {
        if (!existingHandles.has(c.handle.toLowerCase())) {
          allCandidates.push(c);
          existingHandles.add(c.handle.toLowerCase());
        }
      }
    }

    await saveCandidates(allCandidates);

    console.log(`\n🎉 Discovery complete!`);
    console.log(`   Total candidates: ${allCandidates.length}`);
    console.log(
      `   Instagram: ${allCandidates.filter((c) => c.platform === "instagram").length}`,
    );
    console.log(
      `   TikTok: ${allCandidates.filter((c) => c.platform === "tiktok").length}`,
    );
  } finally {
    await context.close();
  }
}

main().catch(console.error);
