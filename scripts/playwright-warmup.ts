#!/usr/bin/env npx tsx
import { chromium, type Page } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = path.join(process.cwd(), "playwright-session");
const DATA_DIR = path.join(process.cwd(), "data");
const CANDIDATES_FILE = path.join(DATA_DIR, "influencer-candidates.json");
const ACTION_LOG_FILE = path.join(DATA_DIR, "action-log.json");

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
  status: "new" | "warming" | "warmed" | "dmed" | "replied" | "skipped";
}

interface ActionLog {
  date: string;
  actions: Array<{
    timestamp: string;
    type: "follow" | "comment" | "dm";
    platform: string;
    targetHandle: string;
  }>;
}

const RATE_LIMITS = {
  instagram: {
    followsPerDay: 30,
    commentsPerDay: 25,
    windowSize: 10,
    maxPerWindow: 5,
  },
  tiktok: {
    followsPerDay: 20,
    commentsPerDay: 20,
    windowSize: 10,
    maxPerWindow: 5,
  },
};

const COMMENTS = {
  photography: [
    "Your headshot work is incredible! The lighting really makes subjects pop 🔥",
    "Love how you capture natural expressions in your portraits. Great work!",
    "Your portfolio is inspiring — really clean, professional headshots",
    "The way you light your subjects is next level. Amazing portfolio!",
    "Such a great eye for composition in your portraits. Following for inspo!",
  ],
  career: [
    "Love your perspective on personal branding — really valuable insights here",
    "Great advice on standing out professionally. Your content is super helpful!",
    "This is such an important topic for professionals. Thanks for sharing!",
    "Your tips on career growth are always on point. Keep it up!",
    "Really resonates with me as someone building their professional brand",
  ],
  ai: [
    "Love seeing how AI is transforming creative workflows. Great content!",
    "Your take on AI tools for business is really insightful. Following along!",
    "This is exactly the kind of practical AI content I love to see",
    "Great breakdown of how AI can actually help professionals day-to-day",
    "AI in creative fields is moving so fast — your content keeps me updated",
  ],
  realestate: [
    "Great tips for real estate professionals! First impressions matter so much",
    "Love your approach to building a real estate brand. Really helpful content!",
    "Your insights on client relationships in real estate are spot on",
    "Professional presentation makes such a difference in this industry. Great advice!",
    "Your content is gold for agents looking to level up their game",
  ],
  entrepreneurship: [
    "Love your founder journey content — really resonates with me",
    "Building a business is tough, but your content makes it feel achievable!",
    "Great insights on entrepreneurship. Love following your journey!",
    "Your perspective on scaling a business is really valuable. Thanks for sharing!",
    "This is why I love this community — founders helping founders. Great post!",
  ],
};

function getTodaysDate(): string {
  return new Date().toISOString().split("T")[0];
}

function loadActionLog(): ActionLog {
  if (fs.existsSync(ACTION_LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ACTION_LOG_FILE, "utf-8"));
    } catch {
      return { date: getTodaysDate(), actions: [] };
    }
  }
  return { date: getTodaysDate(), actions: [] };
}

function saveActionLog(log: ActionLog) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ACTION_LOG_FILE, JSON.stringify(log, null, 2));
}

function getTodaysActions(
  log: ActionLog,
  platform: string,
): ActionLog["actions"] {
  if (log.date !== getTodaysDate()) return [];
  return log.actions.filter((a) => a.platform === platform);
}

function loadCandidates(): Candidate[] {
  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log("No candidates file found. Run playwright-discover.ts first.");
    return [];
  }
  return JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"));
}

function saveCandidates(candidates: Candidate[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));
}

function pickComment(niche: string): string {
  const pool = COMMENTS[niche as keyof typeof COMMENTS] || COMMENTS.photography;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function randomDelay(minMs = 2000, maxMs = 6000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((r) => setTimeout(r, delay));
}

async function checkRateLimit(
  log: ActionLog,
  platform: string,
  actionType: "follow" | "comment",
): Promise<boolean> {
  const today = getTodaysActions(log, platform);
  const limits = RATE_LIMITS[platform as keyof typeof RATE_LIMITS];

  const actionsToday = today.filter((a) => a.type === actionType).length;
  const typeLimit =
    actionType === "follow" ? limits.followsPerDay : limits.commentsPerDay;
  if (actionsToday >= typeLimit) {
    console.log(
      `   ⏭️ Hit ${actionType} limit for ${platform} today (${actionsToday}/${typeLimit})`,
    );
    return false;
  }

  const now = Date.now();
  const windowActions = today.filter(
    (a) =>
      now - new Date(a.timestamp).getTime() < limits.windowSize * 60 * 1000,
  );
  if (windowActions.length >= limits.maxPerWindow) {
    console.log(
      `   ⏳ Rate window full (${windowActions.length}/${limits.maxPerWindow}), waiting...`,
    );
    await new Promise((r) =>
      setTimeout(
        r,
        (limits.windowSize * 60 * 1000) / limits.maxPerWindow + 10000,
      ),
    );
  }
  return true;
}

async function followUser(page: Page, profileUrl: string): Promise<boolean> {
  try {
    await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 25000 });
    await randomDelay(2000, 3000);

    const followButton = page
      .locator('button:has-text("Follow"), button:has-text("Following")')
      .first();
    if (await followButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await followButton.textContent();
      if (text && !text.includes("Following") && !text.includes("Requested")) {
        await followButton.click();
        await randomDelay(1000, 2000);
        console.log(`      ✅ Followed`);
        return true;
      }
      console.log(`      ℹ️ Already following`);
      return true;
    }
    console.log(`      ℹ️ No follow button found`);
    return false;
  } catch (e) {
    console.log(`      ⚠️ Follow failed: ${e}`);
    return false;
  }
}

async function commentOnPost(
  page: Page,
  postUrl: string,
  niche: string,
): Promise<boolean> {
  try {
    await page.goto(postUrl, { waitUntil: "networkidle", timeout: 25000 });
    await randomDelay(2000, 3000);

    const commentInput = page
      .locator(
        'textarea[placeholder*="Comment"], input[placeholder*="Comment"], [aria-label*="Comment"], [role="textbox"]',
      )
      .first();

    if (!(await commentInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log(`      ⚠️ No comment input visible`);
      return false;
    }

    const commentText = pickComment(niche);
    await commentInput.click();
    await randomDelay(500, 1000);
    await commentInput.fill(commentText);
    await randomDelay(500, 1000);

    const postButton = page
      .locator(
        'button:has-text("Post"), button:has-text("Send"), [aria-label*="Post"], div[role="button"]:has-text("Post")',
      )
      .first();
    await postButton.click().catch(() => commentInput.press("Enter"));
    await randomDelay(1000, 2000);

    console.log(`      💬 Commented: "${commentText.slice(0, 60)}..."`);
    return true;
  } catch (e) {
    console.log(`      ⚠️ Comment failed: ${e}`);
    return false;
  }
}

async function warmupSession(platform: "instagram" | "tiktok") {
  console.log(`\n🔥 Warmup for ${platform}`);
  console.log(`   ${"=".repeat(40)}`);

  const candidates = loadCandidates().filter(
    (c) =>
      c.platform === platform && (c.status === "new" || c.status === "warming"),
  );

  if (candidates.length === 0) {
    console.log(`   No candidates needing warmup for ${platform}`);
    return;
  }

  console.log(`   ${candidates.length} candidates to process`);

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: { width: 1280, height: 720 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();
  const actionLog = loadActionLog();

  try {
    for (const candidate of candidates) {
      console.log(`\n📋 @${candidate.handle} (${candidate.nicheGuess})`);

      if (candidate.status === "new") {
        const allowed = await checkRateLimit(actionLog, platform, "follow");
        if (!allowed) break;

        const followed = await followUser(page, candidate.profileUrl);
        if (followed) {
          candidate.status = "warming";
          actionLog.actions.push({
            timestamp: new Date().toISOString(),
            type: "follow",
            platform,
            targetHandle: candidate.handle,
          });
          saveActionLog(actionLog);
          saveCandidates(loadCandidates());
        }
        await randomDelay(3000, 7000);
      }

      if (candidate.status === "warming") {
        const allowed = await checkRateLimit(actionLog, platform, "comment");
        if (!allowed) break;

        if (candidate.recentPosts.length > 0) {
          const postUrl = candidate.recentPosts[0].url;
          const commented = await commentOnPost(
            page,
            postUrl,
            candidate.nicheGuess,
          );
          if (commented) {
            candidate.status = "warmed";
            actionLog.actions.push({
              timestamp: new Date().toISOString(),
              type: "comment",
              platform,
              targetHandle: candidate.handle,
            });
            saveActionLog(actionLog);
            saveCandidates(loadCandidates());
          }
        } else {
          console.log(`   ⏭️ No posts to comment on`);
        }
        await randomDelay(3000, 7000);
      }
    }
  } finally {
    await context.close();
  }

  console.log(`\n✅ Warmup complete for ${platform}`);
}

async function main() {
  console.log("🔥 Truzot Influencer Warmup");
  console.log("===========================\n");

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log("❌ No candidates file found.");
    console.log("   Run playwright-discover.ts first to discover influencers.");
    process.exit(1);
  }

  const candidates = loadCandidates();
  console.log(`📋 Loaded ${candidates.length} candidates`);

  const newAndWarming = candidates.filter(
    (c) => c.status === "new" || c.status === "warming",
  );
  console.log(`   New: ${candidates.filter((c) => c.status === "new").length}`);
  console.log(
    `   Warming: ${candidates.filter((c) => c.status === "warming").length}`,
  );
  console.log(
    `   Warmed: ${candidates.filter((c) => c.status === "warmed").length}`,
  );
  console.log(
    `   DMed: ${candidates.filter((c) => c.status === "dmed").length}`,
  );

  if (newAndWarming.length === 0) {
    console.log("\n🎉 All candidates are warmed up! Ready for DM outreach.");
    console.log("   Run playwright-dm.ts to start DMs.");
    return;
  }

  await warmupSession("instagram");
  await warmupSession("tiktok");

  const remaining = loadCandidates().filter(
    (c) => c.status === "new" || c.status === "warming",
  );
  if (remaining.length > 0) {
    console.log(
      `\n📅 ${remaining.length} candidates still need warmup — run again tomorrow`,
    );
  } else {
    console.log("\n🎉 All candidates warmed up! Run playwright-dm.ts now.");
  }
}

main().catch(console.error);
