import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api/",
        "/login",
        "/claim-order",
        "/privacy",
        "/terms",
        "/refund",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
