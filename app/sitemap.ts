import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: siteUrl, changeFrequency: "monthly" as const, priority: 1.0 },
    {
      url: `${siteUrl}/upload`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/faq`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/team`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  const blogPosts = [
    {
      slug: "why-your-linkedin-headshot-matters",
      lastModified: "2026-05-12",
    },
    {
      slug: "tips-for-perfect-ai-training-selfies",
      lastModified: "2026-05-05",
    },
    { slug: "future-of-professional-photography", lastModified: "2026-04-28" },
  ];

  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: post.lastModified,
  }));

  return [...staticPages, ...blogEntries];
}
