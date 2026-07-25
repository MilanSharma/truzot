import { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/seo";

import { COMPETITORS } from "@/lib/seo-data/competitors";

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
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How is Truzot different from ${comp.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Truzot needs only 2-10 selfies (${comp.name} requires ${comp.selfies.toLowerCase()}), delivers in as fast as 5 minutes versus ${comp.turnaround}, and backs every order with a 30-day money-back guarantee where you keep the photos either way.`
        }
      },
      {
        "@type": "Question",
        "name": `How much does Truzot cost compared to ${comp.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Truzot is a one-time payment from $29 to $59 with no subscription, and includes full commercial rights on every plan. ${comp.name} is priced at ${comp.price}.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I get a refund if I don't like my Truzot headshots?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes. Truzot offers a 30-day money-back guarantee with no questions asked, and you keep your photos either way. ${comp.name}'s policy is ${comp.refund}.`
        }
      }
    ]
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
            ["Price", "$29-$59", comp.price],
            ["Selfies you upload", "Just 2-10", comp.selfies],
            ["Turnaround", "As fast as 5 minutes", comp.turnaround],
            ["Refund policy", "30 days — and you keep the photos", comp.refund],
            ["Commercial rights", "Included on every plan", "Varies"],
            ["Photo data deleted", "Automatically after 30 days", "Varies"],
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
