#!/usr/bin/env npx tsx
/**
 * Publish article to Hashnode
 *
 * Setup:
 * 1. Get Personal Access Token: https://hashnode.com/settings/developer
 * 2. Get Publication ID: curl -X POST https://gql.hashnode.com -H "Content-Type: application/json" -d '{"query":"{ publication(host:\"yourblog.hashnode.dev\") { id title } }"}'
 * 3. Set HASHNODE_PAT and HASHNODE_PUBLICATION_ID environment variables
 * 4. Run: npx tsx scripts/publish-hashnode.ts <path-to-mdx-file>
 */

import fs from "fs";
import path from "path";
import { parseFrontmatter, stripFrontmatter } from "@/lib/blog";

interface HashnodeVariables {
  input: {
    title: string;
    contentMarkdown: string;
    publicationId: string;
    tags: { name: string; slug: string }[];
    originalArticleURL: string;
    slug: string;
  };
}

async function publishToHashnode(filePath: string) {
  const pat = process.env.HASHNODE_PAT;
  const publicationId = process.env.HASHNODE_PUBLICATION_ID;

  if (!pat || !publicationId) {
    console.error("❌ HASHNODE_PAT and HASHNODE_PUBLICATION_ID required");
    console.error("   PAT: https://hashnode.com/settings/developer");
    console.error(
      '   Publication ID: curl -X POST https://gql.hashnode.com -H \'Content-Type: application/json\' -d \'{"query":"{ publication(host:\\"yourblog.hashnode.dev\\") { id title } }"}\'',
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const frontmatter = parseFrontmatter(raw);
  const content = stripFrontmatter(raw);

  const slug = path.basename(filePath).replace(/\.mdx?$/, "");
  const canonicalUrl = `https://truzot.com/blog/${slug}`;

  const tags = (frontmatter.tags || "")
    .split(",")
    .map((t: string) => ({
      name: t.trim(),
      slug: t
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    }))
    .filter((t) => t.name.length > 0);

  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          url
        }
      }
    }
  `;

  const variables: HashnodeVariables = {
    input: {
      title: frontmatter.title || slug,
      contentMarkdown: content,
      publicationId,
      tags,
      originalArticleURL: canonicalUrl,
      slug,
    },
  };

  console.log(`📤 Publishing to Hashnode: "${frontmatter.title}"`);
  console.log(`   Tags: ${tags.map((t) => t.name).join(", ")}`);
  console.log(`   Canonical: ${canonicalUrl}`);

  const res = await fetch("https://gql.hashnode.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: pat,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const data = await res.json();

  if (data.errors) {
    console.error("❌ Failed:", JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }

  console.log(`✅ Published! URL: ${data.data.publishPost.post.url}`);
  console.log(`   Post ID: ${data.data.publishPost.post.id}`);
  return data;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error(
    "Usage: npx tsx scripts/publish-hashnode.ts <path-to-mdx-file>",
  );
  process.exit(1);
}

publishToHashnode(filePath);
