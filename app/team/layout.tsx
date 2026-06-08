import type { Metadata } from "next";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

const seo = PAGE_SEO.team;

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  authors: [{ name: "Truzot" }],
  creator: "Truzot",
  alternates: { canonical: `${SITE_CONFIG.url}/team` },
  openGraph: {
    title: seo.ogTitle || seo.title,
    description: seo.ogDescription || seo.description,
    url: `${SITE_CONFIG.url}/team`,
    siteName: "Truzot",
    images: [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.ogTitle || seo.title,
    description: seo.ogDescription || seo.description,
    images: [SITE_CONFIG.ogImage],
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
