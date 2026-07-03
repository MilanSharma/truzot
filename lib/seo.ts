const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export const SITE_CONFIG = {
  name: "Truzot",
  tagline: "AI Professional Headshots",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  ogImage: `${siteUrl}/og-image.png`,
  twitterHandle: "@truzot",
  locale: "en_US",
} as const;

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

const H_KEYWORDS = [
  "AI headshots",
  "professional headshots",
  "LinkedIn headshots",
  "corporate headshots",
  "actor headshots",
  "model comp cards",
  "dating profile pictures",
  "student headshots",
  "AI photo generator",
  "headshot generator",
  "professional portrait AI",
  "business headshots online",
  "AI portrait generator",
  "headshots near me",
  "online headshot maker",
  "AI photography",
  "professional profile picture",
  "team headshots",
  "executive headshots",
  "headshot photographer alternative",
  "AI headshot app",
  "best AI headshot generator",
  "headshots for LinkedIn profile",
  "professional photo AI",
];

export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title:
      "AI Headshot Generator | Professional AI Headshots for LinkedIn in Minutes | Truzot",
    description:
      "Generate studio-quality AI headshots from your selfies. The #1 AI photo generator for LinkedIn, actors, models, dating profiles, and teams. Get 40-200+ HD headshots in minutes. Starting at $29. 100% money-back guarantee.",
    keywords: [
      "AI headshot generator",
      "professional AI headshots",
      "LinkedIn headshot AI",
      "AI headshots for teams",
      "corporate headshot generator",
      "AI portrait generator",
      "best AI headshot app",
      "headshots from selfie",
      "AI photography",
      "professional profile picture AI",
      "Truzot AI headshots",
      "cheap professional headshots",
      "online headshot maker",
    ],
    canonical: siteUrl,
    ogTitle:
      "Truzot | #1 AI Headshot Generator for Professional LinkedIn Photos",
    ogDescription:
      "Turn your selfies into studio-quality professional headshots in minutes. AI-powered. 10-minute delivery. Trusted by thousands of professionals.",
  },
  upload: {
    title:
      "Create AI Professional Headshots Online — Truzot Headshot Generator",
    description:
      "Upload your selfies and get AI-generated professional headshots for LinkedIn, resumes, and company pages. Choose from 6 style categories including corporate, casual, and creative. Starting at $29. No subscription required.",
    keywords: [
      ...H_KEYWORDS,
      "upload photos for AI headshots",
      "AI headshot generator online",
      "make professional headshot online",
      "create LinkedIn photo",
      "AI headshot creator",
    ],
    canonical: `${siteUrl}/upload`,
    ogTitle:
      "Create AI Headshots Online — Upload Your Photos, Get Professional Results",
    ogDescription:
      "Upload 1-5 selfies and get 40-200 professional AI headshots delivered in minutes. Corporate, LinkedIn, creative styles available.",
  },
  faq: {
    title:
      "AI Headshots FAQ — Everything About Professional AI Headshots | Truzot",
    description:
      "Frequently asked questions about AI headshot generation. Learn how AI headshots work, turnaround times, privacy and security, pricing, team plans, and our 100% money-back guarantee.",
    keywords: [
      "AI headshots FAQ",
      "how do AI headshots work",
      "are AI headshots good for LinkedIn",
      "professional headshot questions",
      "AI headshot generator how it works",
      "headshot privacy",
      "AI headshots safe",
    ],
    canonical: `${siteUrl}/faq`,
    ogTitle: "AI Headshots FAQ — All Your Questions Answered",
    ogDescription:
      "Learn everything about AI professional headshots: how they work, turnaround times, pricing, privacy, and our satisfaction guarantee.",
  },
  contact: {
    title: "Contact Truzot — AI Headshot Support & Inquiries",
    description:
      "Get in touch with the Truzot team. Contact us for support, partnership inquiries, team pricing, or any questions about AI professional headshot generation. We respond within 24 hours.",
    keywords: [
      "contact Truzot",
      "AI headshot support",
      "AI headshot help",
      "professional headshot inquiries",
      "Truzot customer service",
    ],
    canonical: `${siteUrl}/contact`,
    ogTitle: "Contact Truzot AI Headshots — We're Here to Help",
  },
  blog: {
    title: "AI Headshots Blog — Tips, Guides & Professional Branding | Truzot",
    description:
      "Expert tips, comprehensive guides, and insights about AI headshots, professional photography alternatives, LinkedIn profile optimization, personal branding, and career advancement.",
    keywords: [
      "AI headshots blog",
      "professional headshot tips",
      "LinkedIn photo guide",
      "personal branding tips",
      "AI photography guide",
      "professional portrait tips",
      "career branding",
    ],
    canonical: `${siteUrl}/blog`,
  },
  team: {
    title:
      "Team AI Headshots — Consistent Corporate Headshots for Teams | Truzot",
    description:
      "Get consistent, professional AI headshots for your entire team or organization. Bulk pricing for companies, startups, and remote teams. Perfect for company pages, LinkedIn, and internal directories.",
    keywords: [
      "team headshots",
      "corporate headshots bulk",
      "AI headshots for teams",
      "company headshots",
      "employee headshots",
      "business headshots package",
      "startup team photos",
    ],
    canonical: `${siteUrl}/team`,
    ogTitle:
      "Team AI Headshots — Consistent Professional Headshots for Your Organization",
    ogDescription:
      "Get studio-quality headshots for your entire team. Bulk pricing available. Perfect for company websites and LinkedIn.",
  },
  free: {
    title: "Free AI Headshot Generator",
    description:
      "Try our AI headshot generator for free. Generate a professional headshot from your photo at no cost. See the quality before you buy. Upgrade to unlock all styles and HD downloads.",
    keywords: [
      "free professional headshot",
      "try AI headshots free",
      "free headshot maker",
    ],
    ogDescription:
      "Generate a professional AI headshot for free. See the quality yourself before choosing a plan.",
  },
  about: {
    title: "About Truzot — AI Headshot Platform for Professionals",
    description:
      "Learn about Truzot, the AI-powered headshot platform helping thousands of professionals get studio-quality photos from home. Our mission, team, and technology.",
    keywords: [
      "about Truzot",
      "AI headshot company",
      "professional headshot platform",
      "AI photography startup",
      "Truzot team",
    ],
    canonical: `${siteUrl}/about`,
    ogTitle: "About Truzot — High-End AI Photography for Everyone",
  },
  pricing: {
    title: "AI Headshot Pricing — Professional Headshots from $29 | Truzot",
    description:
      "Choose the perfect AI headshot plan for your needs. Basic ($29) — 40 HD headshots. Pro ($39) — 100 premium headshots. Executive ($59) — 200 ultra HD headshots. 100% money-back guarantee.",
    keywords: [
      "AI headshot pricing",
      "professional headshot cost",
      "headshot generator plans",
      "best value headshots",
      "affordable professional headshots",
      "headshot prices",
    ],
    ogTitle: "AI Headshot Pricing — Starting at $29, One-Time Payment",
    ogDescription:
      "Basic ($29), Pro ($39), or Executive ($59). One-time payment, no subscription. 100% money-back guarantee.",
  },
  login: {
    title: "Sign In — Truzot AI Headshots Dashboard",
    description:
      "Sign in to your Truzot account to access your AI headshots, order history, and dashboard.",
    noindex: true,
  },
  privacy: {
    title: "Privacy Policy — Truzot AI Headshots",
    description:
      "How Truzot collects, processes, stores, and protects your personal data and uploaded photos. GDPR and CCPA compliant.",
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
      "Truzot's 100% satisfaction guarantee and refund policy for AI headshot orders. Full refund within 14 days if not satisfied.",
    noindex: true,
  },
};
