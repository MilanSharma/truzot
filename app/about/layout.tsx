import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  alternates: { canonical: `${SITE_CONFIG.url}/about` },
  openGraph: {
    title: PAGE_SEO.about.title,
    description: PAGE_SEO.about.description,
    url: `${SITE_CONFIG.url}/about`,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
