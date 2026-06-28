import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import { CITIES } from "@/lib/seo-data/cities";
import { STYLES } from "@/lib/seo-data/styles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: siteUrl, changeFrequency: "weekly" as const, priority: 1.0, lastModified: new Date() },
    { url: `${siteUrl}/upload`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: new Date() },
    { url: `${siteUrl}/pricing`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: new Date() },
    { url: `${siteUrl}/faq`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: new Date() },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: new Date() },
    { url: `${siteUrl}/free`, changeFrequency: "weekly" as const, priority: 0.7, lastModified: new Date() },
  ];

  const blogPosts = getAllPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: post.date ? new Date(post.date) : new Date(),
  }));

  const professionEntries = PROFESSIONS.map((profession) => ({
    url: `${siteUrl}/profession/${profession.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    lastModified: new Date(),
  }));

  const cityEntries = CITIES.map((city) => ({
    url: `${siteUrl}/city/${city.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
    lastModified: new Date(),
  }));

  const styleEntries = STYLES.map((style) => ({
    url: `${siteUrl}/style/${style.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
    lastModified: new Date(),
  }));

  const comboEntries = PROFESSIONS.slice(0, 20).flatMap((profession) =>
    CITIES.slice(0, 100).map((city) => ({
      url: `${siteUrl}/headshots/${profession.id}-in-${city.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
      lastModified: new Date(),
    }))
  );

  return [
    ...staticPages,
    ...blogPosts,
    ...professionEntries,
    ...cityEntries,
    ...styleEntries,
    ...comboEntries,
  ];
}
