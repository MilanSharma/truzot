const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export const SITE_CONFIG = {
  name: "Truzot",
  tagline: "AI Professional Headshots",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  ogImage: "/og-image.png",
  twitterHandle: "@truzot",
  locale: "en_US",
} as const;

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title: "Truzot AI Headshots — Professional Headshots in Minutes",
    description:
      "Generate AI-powered professional headshots from your photos. No studio, no photographer. Get LinkedIn-ready corporate headshots in under an hour. Trusted by 10,000+ professionals.",
    keywords:
      "AI headshots, professional headshots, LinkedIn headshots, corporate headshots, AI photo generator, headshot generator",
  },
  upload: {
    title: "Upload Photos — Truzot AI Headshots",
    description:
      "Upload your selfies and get AI-generated professional headshots. Choose your style, clothing, and background. Starting at $29.",
    keywords:
      "upload photos for AI headshots, AI headshot generator, professional headshots online",
  },
  faq: {
    title: "FAQ — Truzot AI Headshots",
    description:
      "Frequently asked questions about AI headshot generation. Learn how Truzot works, turnaround times, privacy, and our money-back guarantee.",
    keywords:
      "AI headshots FAQ, how do AI headshots work, headshot generator questions",
  },
  contact: {
    title: "Contact Us — Truzot AI Headshots",
    description:
      "Get in touch with the Truzot team. Contact us for support, partnership inquiries, or any questions about AI professional headshots.",
    keywords: "contact Truzot, AI headshot support, headshot generator help",
  },
  blog: {
    title: "Blog — Truzot AI Headshots",
    description:
      "Tips, guides, and insights about AI headshots, professional photography, LinkedIn optimization, and personal branding.",
    keywords:
      "AI headshots blog, professional headshot tips, LinkedIn photo guide",
  },
  team: {
    title: "Team Plans — Truzot AI Headshots",
    description:
      "Get consistent, professional AI headshots for your entire team. Bulk pricing for companies, startups, and organizations.",
    keywords:
      "team headshots, corporate headshots bulk, AI headshots for teams",
  },
  free: {
    title: "Free AI Headshot Generator — Truzot",
    description:
      "Try our AI headshot generator for free. Generate a professional headshot from your photo at no cost. Upgrade for full access.",
    keywords:
      "free AI headshot generator, free professional headshot, try AI headshots",
  },
  about: {
    title: "About Us — Truzot AI Headshots",
    description:
      "Learn about Truzot, the AI-powered headshot platform helping professionals get studio-quality photos from home.",
  },
  pricing: {
    title: "Pricing — Truzot AI Headshots",
    description:
      "Choose the perfect AI headshot plan. Basic ($29), Pro ($39), or Executive ($59). 100% money-back guarantee.",
    keywords:
      "AI headshot pricing, professional headshot cost, headshot generator plans",
  },
  login: {
    title: "Sign In — Truzot AI Headshots",
    description:
      "Sign in to your Truzot account to access your AI headshots and dashboard.",
    noindex: true,
  },
  privacy: {
    title: "Privacy Policy — Truzot AI Headshots",
    description:
      "How Truzot collects, processes, stores, and protects your personal data and uploaded photos.",
    noindex: true,
  },
  terms: {
    title: "Terms of Service — Truzot AI Headshots",
    description:
      "Terms and conditions governing the use of Truzot's AI headshot generation service.",
    noindex: true,
  },
  refund: {
    title: "Refund Policy — Truzot AI Headshots",
    description:
      "Truzot's 100% satisfaction guarantee and refund policy for AI headshot orders.",
    noindex: true,
  },
};
