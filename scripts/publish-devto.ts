#!/usr/bin/env npx tsx
/**
 * Publish article to dev.to
 *
 * Setup:
 * 1. Get API key: https://dev.to/settings/extensions
 * 2. Set DEVTO_API_KEY environment variable
 * 3. Run: npx tsx scripts/publish-devto.ts <path-to-mdx-file>
 */

import fs from "fs";
import path from "path";
import { parseFrontmatter, stripFrontmatter } from "@/lib/blog";

interface DevToArticle {
  article: {
    title: string;
    body_markdown: string;
    published: boolean;
    tags: string[];
    canonical_url: string;
    series?: string;
    organization_id?: number;
  };
}

async function publishToDevTo(filePath: string) {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ DEVTO_API_KEY not set. Get it from https://dev.to/settings/extensions",
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const frontmatter = parseFrontmatter(raw);
  const content = stripFrontmatter(raw);

  const slug = path.basename(filePath).replace(/\.mdx?$/, "");
  const canonicalUrl = `https://truzot.com/blog/${slug}`;

  // dev.to tags: max 4, lowercase, alphanumeric only
  const tags = (frontmatter.tags || "")
    .split(",")
    .map((t: string) =>
      t
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
    )
    .filter(Boolean)
    .slice(0, 4);

  const payload: DevToArticle = {
    article: {
      title: frontmatter.title || slug,
      body_markdown: content,
      published: true,
      tags,
      canonical_url: canonicalUrl,
    },
  };

  console.log(`📤 Publishing to dev.to: "${frontmatter.title}"`);
  console.log(`   Tags: ${tags.join(", ")}`);
  console.log(`   Canonical: ${canonicalUrl}`);

  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Failed:", data);
    process.exit(1);
  }

  console.log(`✅ Published! URL: ${data.url}`);
  console.log(`   Article ID: ${data.id}`);
  return data;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/publish-devto.ts <path-to-mdx-file>");
  process.exit(1);
}

publishToDevTo(filePath);
