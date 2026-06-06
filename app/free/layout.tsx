import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.free.title,
  description: PAGE_SEO.free.description,
  keywords: PAGE_SEO.free.keywords,
  alternates: { canonical: `${SITE_CONFIG.url}/free` },
  openGraph: {
    title: PAGE_SEO.free.title,
    description: PAGE_SEO.free.description,
    url: `${SITE_CONFIG.url}/free`,
  },
};

export default function FreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
