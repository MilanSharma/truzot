import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

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
      url: `${siteUrl}/faq`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/team`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/free`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  const blogPosts = getAllPosts();
  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: post.date ? new Date(post.date) : undefined,
  }));

  return [...staticPages, ...blogEntries];
}
