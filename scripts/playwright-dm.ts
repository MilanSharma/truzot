#!/usr/bin/env npx tsx
import { chromium } from "playwright";
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
  profileUrl: string;
  nicheGuess: string;
  status: "new" | "warming" | "warmed" | "dmed" | "replied" | "skipped";
  recentPosts: Array<{ url: string; caption?: string; mediaType: string }>;
}

interface ActionLog {
  date: string;
  actions: Array<{
    timestamp: string;
    type: "follow" | "comment" | "dm" | "order";
    platform: string;
    targetHandle: string;
  }>;
}

const RATE_LIMITS = {
  instagram: { dmsPerDay: 25, windowSize: 10, maxPerWindow: 5 },
  tiktok: { dmsPerDay: 15, windowSize: 10, maxPerWindow: 3 },
};

const DM_TEMPLATES: Record<string, string[]> = {
  photography: [
    "Hey @{handle}! Love your photography work — really clean headshots and portraits. I run Truzot (AI headshots for professionals), would love to hear your take on AI in portrait photography sometime!",
    "Hi @{handle}, your portrait portfolio is amazing! I'm building Truzot, an AI headshot platform, and I think you'd have a great perspective on how AI tools fit into professional photography. Would love to connect!",
    "Hey! Your headshot/portrait work caught my eye — really professional lighting and composition. I'm the founder of Truzot (AI headshots) and always looking to learn from actual photographers. Would be great to chat!",
  ],
  career: [
    "Hey @{handle}! Your career content is super valuable. I'm building Truzot — an AI headshot platform that helps professionals upgrade their personal brand. Thought there might be some interesting crossover!",
    "Hi @{handle}, love your insights on professional development! I run Truzot (AI headshots for the modern professional), and I think our audiences overlap a ton. Would love to connect!",
    "Hey! Your content around career growth really resonates. I'm the founder of Truzot — we do AI-generated professional headshots. Would be great to exchange ideas sometime!",
  ],
  ai: [
    "Hey @{handle}! Love your AI content. I'm building Truzot — an AI headshot platform using fine-tuned models to generate studio-quality professional photos. Would love to hear your thoughts!",
    "Hi @{handle}, your take on AI tools is spot on. I'm the founder of Truzot (AI headshots), and I think you'd find what we're building interesting — we're pushing flux-lora to do studio-quality results from selfies.",
    "Hey! Great AI content. I run Truzot — we use AI to make professional headshots accessible to everyone. I'd love to get your perspective on where the tech is headed in this space!",
  ],
  realestate: [
    "Hey @{handle}! Your real estate content is awesome. First impressions matter so much in this industry — I run Truzot (AI headshots), helping agents present their best selves online. Would love to connect!",
    "Hi @{handle}, great advice for agents! I build Truzot, an AI headshot platform that real estate professionals use for their profiles. Your perspective on branding would be really valuable!",
    "Hey! Love your real estate tips. I run Truzot (AI professional headshots) and we work with a lot of agents who need consistent, high-quality photos across listings and profiles. Would be great to chat!",
  ],
  entrepreneurship: [
    "Hey @{handle}! Love following your founder journey. I'm building Truzot — an AI headshot SaaS that I grew to $10K MRR in 6 months. Would love to connect with other founders!",
    "Hi @{handle}, your entrepreneurial content is great! I'm the founder of Truzot (AI headshots, bootstrapped to $10K MRR). Always great to connect with others building in public!",
    "Hey! Love the founder content. I'm building Truzot (AI headshots) and have been sharing my journey from $0 to $10K MRR. Would love to connect and share notes sometime!",
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
  fs.writeFileSync(ACTION_LOG_FILE, JSON.stringify(log, null, 2));
}

function loadCandidates(): Candidate[] {
  if (!fs.existsSync(CANDIDATES_FILE)) return [];
  return JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"));
}

function saveCandidates(candidates: Candidate[]) {
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));
}

function pickDm(niche: string, handle: string): string {
  const pool =
    DM_TEMPLATES[niche as keyof typeof DM_TEMPLATES] ||
    DM_TEMPLATES.entrepreneurship;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace(/@{handle}/g, handle);
}

async function randomDelay(minMs = 3000, maxMs = 8000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((r) => setTimeout(r, delay));
}

async function checkRateLimits(
  log: ActionLog,
  platform: string,
): Promise<boolean> {
  const today = getTodaysDate();
  if (log.date !== today) return true;

  const limits = RATE_LIMITS[platform as keyof typeof RATE_LIMITS];
  const dmsToday = log.actions.filter(
    (a) => a.type === "dm" && a.platform === platform,
  ).length;

  if (dmsToday >= limits.dmsPerDay) {
    console.log(
      `   ⏭️ Hit DM limit for ${platform} (${dmsToday}/${limits.dmsPerDay})`,
    );
    return false;
  }

  const now = Date.now();
  const windowActions = log.actions.filter(
    (a) =>
      now - new Date(a.timestamp).getTime() < limits.windowSize * 60 * 1000,
  );
  if (windowActions.length >= limits.maxPerWindow) {
    console.log(`   ⏳ Window full, waiting...`);
    await new Promise((r) =>
      setTimeout(
        r,
        (limits.windowSize * 60 * 1000) / limits.maxPerWindow + 15000,
      ),
    );
  }
  return true;
}

async function sendInstagramDm(
  page: any,
  handle: string,
  message: string,
): Promise<boolean> {
  try {
    // Go to profile page
    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await randomDelay(2000, 4000);

    // Click "Message" button on profile
    const messageButton = page
      .locator(
        'div[role="button"]:has-text("Message"), button:has-text("Message"), svg[aria-label="Message"]',
      )
      .first();
    if (
      !(await messageButton.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      // Try the sidebar "Message" text if button not found
      const msgBtn2 = page.locator('div:has-text("Message")').last();
      if (await msgBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgBtn2.click();
      } else {
        console.log(
          `      ⚠️ Message button not found (private/channel account?)`,
        );
        return false;
      }
    } else {
      await messageButton.click();
    }

    await randomDelay(2000, 3000);

    // Wait for DM dialog to open, find textarea, type message
    const textArea = page
      .locator('div[role="textbox"], textarea, div[contenteditable="true"]')
      .first();
    if (!(await textArea.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`      ⚠️ DM input not found`);
      return false;
    }

    await textArea.click();
    await randomDelay(500, 1000);
    await textArea.fill(message);
    await randomDelay(1000, 2000);

    // Send — press Enter
    await textArea.press("Enter");
    await randomDelay(2000, 3000);

    console.log(`      📨 DM sent`);
    return true;
  } catch (e) {
    console.log(`      ⚠️ DM failed: ${e}`);
    return false;
  }
}

async function sendTikTokDm(
  page: any,
  handle: string,
  message: string,
): Promise<boolean> {
  try {
    await page.goto(`https://www.tiktok.com/@${handle}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await randomDelay(2000, 4000);

    // TikTok "Message" button
    const msgBtn = page
      .locator('button:has-text("Message"), [data-e2e*="message"]')
      .first();
    if (!(await msgBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`      ⚠️ Message button not found`);
      return false;
    }
    await msgBtn.click();
    await randomDelay(2000, 3000);

    const textBox = page
      .locator('div[contenteditable="true"], textarea')
      .first();
    if (!(await textBox.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`      ⚠️ DM input not found`);
      return false;
    }

    await textBox.click();
    await textBox.fill(message);
    await randomDelay(1000, 2000);
    await textBox.press("Enter");
    await randomDelay(2000, 3000);

    console.log(`      📨 DM sent`);
    return true;
  } catch (e) {
    console.log(`      ⚠️ DM failed: ${e}`);
    return false;
  }
}

async function dmSession(platform: "instagram" | "tiktok") {
  console.log(`\n📨 DM Session for ${platform}`);
  console.log(`   ${"=".repeat(40)}`);

  const candidates = loadCandidates().filter(
    (c) => c.platform === platform && c.status === "warmed",
  );
  if (candidates.length === 0) {
    console.log(`   No warmed candidates ready for DM on ${platform}`);
    return;
  }

  console.log(`   ${candidates.length} candidates ready for DM`);

  if (platform === "instagram") {
    console.log(
      `\n⚠️ Instagram will check login — if prompted, complete 2FA manually.`,
    );
  }

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
  const log = loadActionLog();

  try {
    for (const candidate of candidates) {
      console.log(`\n📋 @${candidate.handle} (${candidate.nicheGuess})`);

      const allowed = await checkRateLimits(log, platform);
      if (!allowed) break;

      const message = pickDm(candidate.nicheGuess, candidate.handle);
      console.log(`   Message: "${message.slice(0, 80)}..."`);

      let sent = false;
      if (platform === "instagram") {
        sent = await sendInstagramDm(page, candidate.handle, message);
      } else {
        sent = await sendTikTokDm(page, candidate.handle, message);
      }

      if (sent) {
        candidate.status = "dmed";
        log.actions.push({
          timestamp: new Date().toISOString(),
          type: "dm",
          platform,
          targetHandle: candidate.handle,
        });
        log.date = getTodaysDate();
        saveActionLog(log);
        saveCandidates(loadCandidates());
      }

      await randomDelay(4000, 10000);
    }
  } finally {
    await context.close();
  }

  console.log(`\n✅ DMs complete for ${platform}`);
}

async function main() {
  console.log("📨 Truzot Influencer DM Outreach");
  console.log("==============================\n");

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log("❌ No candidates file found.");
    console.log("   Run playwright-discover.ts first.");
    process.exit(1);
  }

  const candidates = loadCandidates();
  const warmed = candidates.filter((c) => c.status === "warmed");

  console.log(`📋 Loaded ${candidates.length} candidates`);
  console.log(`   Warmed & ready for DM: ${warmed.length}`);
  console.log(
    `   Already DMed: ${candidates.filter((c) => c.status === "dmed").length}`,
  );
  console.log(
    `   Replied: ${candidates.filter((c) => c.status === "replied").length}`,
  );

  if (warmed.length === 0) {
    console.log(`\n⏳ No candidates ready for DM yet.`);
    console.log(`   Run playwright-warmup.ts first to follow and engage.`);
    return;
  }

  console.log(`\n⚠️  You'll need to manually log in if the session expired.`);
  console.log(`   The browser will open — complete any 2FA if prompted.\n`);

  await dmSession("instagram");
  await dmSession("tiktok");

  const remaining = loadCandidates().filter((c) => c.status === "warmed");
  if (remaining.length > 0) {
    console.log(
      `\n📅 ${remaining.length} DMs remaining for tomorrow (hit rate limit)`,
    );
  } else {
    console.log("\n🎉 All warmed candidates have been DMed!");
    console.log(
      "   Monitor replies in your inbox and update status to 'replied'.",
    );
  }
}

main().catch(console.error);
