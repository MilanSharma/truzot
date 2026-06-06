import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.team.title,
  description: PAGE_SEO.team.description,
  keywords: PAGE_SEO.team.keywords,
  alternates: { canonical: `${SITE_CONFIG.url}/team` },
  openGraph: {
    title: PAGE_SEO.team.title,
    description: PAGE_SEO.team.description,
    url: `${SITE_CONFIG.url}/team`,
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
