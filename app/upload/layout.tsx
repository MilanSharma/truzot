import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create AI Professional Headshots Online | Truzot",
  description: "Upload your selfies and get AI-generated professional headshots for LinkedIn, resumes, and company pages in minutes. No studio required.",
  alternates: { canonical: `${SITE_CONFIG.url}/upload` },
  openGraph: {
    title: "Create AI Professional Headshots Online | Truzot",
    description: "Upload your selfies and get AI-generated professional headshots in minutes. Choose from Corporate, Creative, LinkedIn, and more.",
    url: `${SITE_CONFIG.url}/upload`,
    images: [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create AI Professional Headshots Online | Truzot",
    description: "Upload your selfies and get AI-generated professional headshots in minutes.",
    images: [SITE_CONFIG.ogImage],
  },
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
