import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";
import LandingPageContent from "@/components/LandingPageContent";
import { WebPageSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "AI Professional Headshots in Minutes",
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
  return (
    <>
      <WebPageSchema
        name="Truzot AI Headshots"
        description="Generate AI-powered professional headshots from your photos. No studio, no photographer. Get LinkedIn-ready corporate headshots in as fast as 5 minutes."
      />
      <LandingPageContent />
    </>
  );
}
