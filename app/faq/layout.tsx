import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.faq.title,
  description: PAGE_SEO.faq.description,
  keywords: PAGE_SEO.faq.keywords,
  alternates: { canonical: `${SITE_CONFIG.url}/faq` },
  openGraph: {
    title: PAGE_SEO.faq.title,
    description: PAGE_SEO.faq.description,
    url: `${SITE_CONFIG.url}/faq`,
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
