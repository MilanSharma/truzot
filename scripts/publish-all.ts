#!/usr/bin/env npx tsx
/**
 * Master publish script - publishes to all supported platforms
 *
 * Usage: npx tsx scripts/publish-all.ts <path-to-mdx-file>
 *
 * Required env vars:
 * - DEVTO_API_KEY (for dev.to)
 * - HASHNODE_PAT + HASHNODE_PUBLICATION_ID (for Hashnode)
 * - MEDIUM_TOKEN (for Medium)
 *
 * For LinkedIn Articles: Manual only (no API)
 * For LinkedIn Posts: Use zernio_social MCP separately
 */

import { spawnSync } from "child_process";
import path from "path";

const platforms = [
  { name: "dev.to", script: "publish-devto.ts", env: ["DEVTO_API_KEY"] },
  {
    name: "Hashnode",
    script: "publish-hashnode.ts",
    env: ["HASHNODE_PAT", "HASHNODE_PUBLICATION_ID"],
  },
  { name: "Medium", script: "publish-medium.ts", env: ["MEDIUM_TOKEN"] },
];

function runScript(script: string, filePath: string, envVars: string[]) {
  const missing = envVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.log(`⏭️  Skipping ${script} — missing: ${missing.join(", ")}`);
    return { success: false, skipped: true };
  }

  console.log(`\n🚀 Publishing to ${script.replace(".ts", "")}...`);
  const result = spawnSync("npx", ["tsx", `scripts/${script}`, filePath], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  return { success: result.status === 0, skipped: false };
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/publish-all.ts <path-to-mdx-file>");
  console.error(
    "Example: npx tsx scripts/publish-all.ts content/blog/my-article.mdx",
  );
  process.exit(1);
}

const absolutePath = path.resolve(filePath);
if (!fs.existsSync(absolutePath)) {
  console.error(`❌ File not found: ${absolutePath}`);
  process.exit(1);
}

console.log(`📦 Publishing: ${path.basename(absolutePath)}`);
console.log(`==========================================`);

const results = platforms.map((p) => ({
  platform: p.name,
  ...runScript(p.script, absolutePath, p.env),
}));

console.log(`\n==========================================`);
console.log(`📊 Summary:`);
results.forEach((r) => {
  if (r.skipped) {
    console.log(`  ${r.platform}: ⏭️  Skipped (missing env)`);
  } else if (r.success) {
    console.log(`  ${r.platform}: ✅ Success`);
  } else {
    console.log(`  ${r.platform}: ❌ Failed`);
  }
});

console.log(`\n📝 Manual steps needed:`);
console.log(
  `  • LinkedIn Articles: Import manually at linkedin.com/feed/ (no public API)`,
);
console.log(
  `  • LinkedIn Posts: Use zernio_social MCP for social post with link`,
);
console.log(
  `  • Medium alternative: Import at medium.com/me/stories → "Import a story"`,
);

import fs from "fs";
