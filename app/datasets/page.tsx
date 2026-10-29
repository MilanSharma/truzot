import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";
import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";
import DatasetsContent from "@/components/DatasetsContent";

export const metadata: Metadata = {
  title: "Datasets — Truzot",
  description: "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
  alternates: { canonical: `${SITE_CONFIG.url}/datasets` },
};

export default function DatasetsPage() {
  return (
    <div className="min-h-screen">
      <B2BNav />

      <main className="pt-32 pb-20 px-6">
        <DatasetsContent />
      </main>

      <B2BFooter />
    </div>
  );
}
