import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";
import B2BHomepage from "@/components/B2BHomepage";
import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";
import { WebPageSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Premium Synthetic Training Data for Agentic AI",
  description: "Stop wasting engineering hours cleaning messy data. Get 100% schema-validated, human-verified JSONL datasets with built-in error-recovery logic.",
  alternates: { canonical: SITE_CONFIG.url },
  openGraph: {
    title: "Truzot — Premium Synthetic Training Data for Agentic AI",
    description: "Stop wasting engineering hours cleaning messy data. Get 100% schema-validated, human-verified JSONL datasets.",
    url: SITE_CONFIG.url,
  },
};

export default function LandingPage() {
  return (
    <>
      <WebPageSchema
        name="Truzot Synthetic Training Data"
        description="Premium synthetic training data for Agentic AI. 100% schema-validated JSONL datasets with built-in error-recovery logic."
      />
      <B2BNav />
      <B2BHomepage />
      <B2BFooter />
    </>
  );
}
