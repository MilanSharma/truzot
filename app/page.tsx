import PopupSmart from "@/components/PopupSmart";
import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";
import LandingPageContent from "@/components/LandingPageContent";

export const metadata: Metadata = {
  title: "AI Professional Headshots in Minutes | Truzot",
  description: PAGE_SEO.home.description,
  keywords: PAGE_SEO.home.keywords,
  alternates: { canonical: SITE_CONFIG.url },
  openGraph: {
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url: SITE_CONFIG.url,
  },
};

export default function LandingPage() {
  return <LandingPageContent />;
}
