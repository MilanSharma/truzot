#!/usr/bin/env npx tsx
/**
 * Publish article to Medium (official API)
 *
 * Limitations: Can only CREATE posts, not update. No draft scheduling via API.
 *
 * Setup:
 * 1. Get integration token: https://medium.com/me/settings/integrations
 * 2. Set MEDIUM_TOKEN environment variable
 * 3. Run: npx tsx scripts/publish-medium.ts <path-to-mdx-file>
 *
 * Alternative: Use "Import Story" manually at medium.com/me/stories
 */

import fs from "fs";
import path from "path";
import { parseFrontmatter, stripFrontmatter } from "@/lib/blog";

interface MediumPost {
  title: string;
  contentFormat: "html" | "markdown";
  content: string;
  tags?: string[];
  publishStatus?: "public" | "draft" | "unlisted";
  canonicalUrl?: string;
}

async function publishToMedium(filePath: string) {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    console.error(
      "❌ MEDIUM_TOKEN not set. Get it from https://medium.com/me/settings/integrations",
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const frontmatter = parseFrontmatter(raw);
  const content = stripFrontmatter(raw);

  const slug = path.basename(filePath).replace(/\.mdx?$/, "");
  const canonicalUrl = `https://truzot.com/blog/${slug}`;

  // Medium tags: max 5
  const tags = (frontmatter.tags || "")
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const payload: MediumPost = {
    title: frontmatter.title || slug,
    contentFormat: "markdown",
    content,
    tags,
    publishStatus: "public",
    canonicalUrl,
  };

  // First, get user ID
  const userRes = await fetch("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const userData = await userRes.json() as { data?: { id?: string; username?: string } };
  if (!userRes.ok) {
    console.error("❌ Auth failed:", userData);
    process.exit(1);
  }
  const userId = userData.data?.id;

  console.log(`📤 Publishing to Medium: "${frontmatter.title}"`);
  console.log(`   User: @${userData.data?.username}`);
  console.log(`   Tags: ${tags.join(", ")}`);
  console.log(`   Canonical: ${canonicalUrl}`);

  const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as { data?: { url?: string; id?: string } };

  if (!res.ok) {
    console.error("❌ Failed:", data);
    process.exit(1);
  }

  console.log(`✅ Published! URL: ${data.data?.url}`);
  console.log(`   Post ID: ${data.data?.id}`);
  return data;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/publish-medium.ts <path-to-mdx-file>");
  process.exit(1);
}

publishToMedium(filePath);
