import { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/seo";

const COMPETITORS = {
  "aragon-alternative": { name: "Aragon AI", price: "$29-$69", turnaround: "60-120 mins", styles: "Limited", likeness: "Hit or miss", refund: "Strict / Case-by-case" },
  "headshotpro-alternative": { name: "HeadshotPro", price: "$29-$59", turnaround: "2 hours", styles: "Corporate only", likeness: "Good", refund: "14 days" },
  "betterphoto-alternative": { name: "BetterPicture", price: "$25-$45", turnaround: "2-4 hours", styles: "Basic", likeness: "Average", refund: "No refunds" },
  "secta-alternative": { name: "Secta AI", price: "$49-$99", turnaround: "1-2 hours", styles: "Good", likeness: "Good", refund: "Partial" },
};

export function generateStaticParams() {
  return Object.keys(COMPETITORS).map((c) => ({ competitor: c }));
}

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const comp = COMPETITORS[params.competitor as keyof typeof COMPETITORS];
  if (!comp) return { title: "Not Found" };
  return {
    // absolute → bypass the root "— Truzot AI Headshots" suffix so the brand
    // isn't repeated (the title already leads with "Truzot vs …").
    title: { absolute: `Truzot vs ${comp.name}: Best AI Headshot Alternative 2026` },
    description: `Comparing Truzot and ${comp.name} for AI headshots. See why professionals choose Truzot for better likeness, more styles, and guaranteed results.`,
    alternates: { canonical: `${SITE_CONFIG.url}/compare/${params.competitor}` }
  };
}

export default async function ComparePage(props: any) {
  const params = await props.params;
  const comp = COMPETITORS[params.competitor as keyof typeof COMPETITORS];
  if (!comp) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": `Is Truzot better than ${comp.name}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `Truzot offers superior facial likeness using custom Flux LoRA models, a 100% money-back guarantee, and faster turnaround times compared to ${comp.name}.`
      }
    }]
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Nav />
      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[var(--lime)] font-bold uppercase tracking-widest text-xs mb-4">Comparison</p>
          <h1 className="text-4xl md:text-6xl font-black mb-6">Truzot vs {comp.name}</h1>
          <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">See why professionals choose Truzot for studio-quality AI headshots.</p>
        </div>
        
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden mb-12 shadow-[var(--shadow-lg)]">
          <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--surface2)] font-bold text-sm">
            <div className="p-4 md:p-6 text-[var(--text-muted)]">Feature</div>
            <div className="p-4 md:p-6 text-[var(--lime)] border-l border-r border-[var(--border)] bg-[var(--lime-dim)]">Truzot</div>
            <div className="p-4 md:p-6 text-[var(--text-muted)]">{comp.name}</div>
          </div>
          
          {[
            ["Price", "From $29", comp.price],
            ["Turnaround", "As fast as 5 minutes", comp.turnaround],
            ["Styles", "6+ Categories (Customizable)", comp.styles],
            ["Facial Likeness", "Unmatched (Flux LoRA)", comp.likeness],
            ["Refund Policy", "100% No-questions-asked (30 days)", comp.refund],
            ["Data Privacy", "Auto-delete after 30 days", "Varies"],
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-[var(--border)] last:border-0 text-sm">
              <div className="p-4 md:p-6 font-semibold text-[var(--text-muted)]">{row[0]}</div>
              <div className="p-4 md:p-6 font-bold text-[var(--text)] border-l border-r border-[var(--border)] bg-[var(--lime)]/5">{row[1]}</div>
              <div className="p-4 md:p-6 text-[var(--text-muted)]">{row[2]}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/upload" className="btn-primary inline-flex text-lg px-8 py-4">Create your headshots now</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
