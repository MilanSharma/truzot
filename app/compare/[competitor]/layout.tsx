import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_CONFIG.url}/compare` },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
