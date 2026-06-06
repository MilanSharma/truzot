import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    {
      url: siteUrl,
      changeFrequency: "weekly" as const,
      priority: 1.0,
      lastModified: new Date("2026-06-06"),
    },
    {
      url: `${siteUrl}/upload`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      lastModified: new Date("2026-06-06"),
    },
    {
      url: `${siteUrl}/faq`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: new Date("2026-06-06"),
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: new Date("2026-06-06"),
    },
    {
      url: `${siteUrl}/team`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/free`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  const blogPosts = getAllPosts();
  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: post.date ? new Date(post.date) : new Date("2026-06-06"),
  }));

  return [...staticPages, ...blogEntries];
}
