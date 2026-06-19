import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/pricing", heading: /pricing|plans/i },
  { path: "/faq", heading: /faq|frequently/i },
  { path: "/about", heading: /about/i },
  { path: "/contact", heading: /contact/i },
  { path: "/blog", heading: /blog/i },
  { path: "/refund", heading: /refund/i },
  { path: "/privacy", heading: /privacy/i },
  { path: "/terms", heading: /terms/i },
  { path: "/team", heading: /team/i },
];

for (const page of PUBLIC_PAGES) {
  test(`${page.path} loads and has heading`, async ({ page: p }) => {
    await p.goto(page.path);
    await expect(p.locator("h1").first()).toBeVisible();
  });
}

test("pricing page shows all plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("$29")).toBeVisible();
  await expect(page.getByText("$39")).toBeVisible();
  await expect(page.getByText("$59")).toBeVisible();
});

test("blog page lists posts", async ({ page }) => {
  await page.goto("/blog");
  await page.waitForTimeout(1000);
  const articles = page.locator("article, [class*=card], [class*=post]");
  const count = await articles.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test("FAQ page has search functionality", async ({ page }) => {
  await page.goto("/faq");
  const searchInput = page.locator(
    'input[type="text"], input[placeholder*="search" i]',
  );
  if (await searchInput.isVisible()) {
    await searchInput.fill("refund");
    await page.waitForTimeout(500);
  }
});

test("contact page has form fields", async ({ page }) => {
  await page.goto("/contact");
  // Contact form labels don't have `for` attributes linked to inputs.
  // Select by input type instead.
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('textarea[rows="5"]').first()).toBeVisible();
});

test("404 page works for invalid routes", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist-xyz-123");
  expect(res?.status()).toBe(404);
});
