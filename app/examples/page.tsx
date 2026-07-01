import { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ComparisonSlider from "@/components/ComparisonSlider";
import { ArrowRight, Sparkles, Filter } from "lucide-react";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Real AI Headshot Examples & Transformations | Truzot",
  description: "See real before and after transformations. Truzot turns casual selfies into professional studio-quality headshots in minutes. Browse our gallery of 200+ examples.",
  alternates: { canonical: `${SITE_CONFIG.url}/examples` },
};

const EXAMPLES = [
  { before: "/shots/girl1 - before.jpg", after: "/shots/girl1 - after.jpeg", style: "Corporate", gender: "Female", plan: "Pro" },
  { before: "/shots/man1 - before.jpg", after: "/shots/man1 - after.jpeg", style: "LinkedIn", gender: "Male", plan: "Basic" },
  { before: "/shots/girl2 - before.jpg", after: "/shots/girl2 - after.jpeg", style: "Creative", gender: "Female", plan: "Pro" },
  { before: "/shots/man2- before.jpg", after: "/shots/man2- after.jpeg", style: "Startup", gender: "Male", plan: "Executive" },
  { before: "/shots/girl3 - before.jpg", after: "/shots/girl3 - after.jpeg", style: "Corporate", gender: "Female", plan: "Executive" },
  { before: "/shots/man3 - before.jpg", after: "/shots/man3 - after.jpeg", style: "Casual", gender: "Male", plan: "Basic" },
  { before: "/shots/girl4 - before.jpg", after: "/shots/girl4 - after.jpeg", style: "LinkedIn", gender: "Female", plan: "Pro" },
  { before: "/shots/man4 - before.jpg", after: "/shots/man4 - after.jpeg", style: "Creative", gender: "Male", plan: "Pro" },
  { before: "/shots/man5 - before.jpg", after: "/shots/man5 - after.jpeg", style: "Corporate", gender: "Male", plan: "Executive" },
  { before: "/shots/man6 - before.jpg", after: "/shots/man6 - after.jpeg", style: "Startup", gender: "Male", plan: "Basic" },
];

export default function ExamplesPage() {
  // Schema markup for ImageGallery
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "Truzot AI Headshot Examples",
    "description": "Before and after transformations of AI-generated professional headshots.",
    "url": `${SITE_CONFIG.url}/examples`,
    "image": EXAMPLES.map(ex => `${SITE_CONFIG.url}${ex.after}`)
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[var(--lime)] font-bold uppercase tracking-widest text-xs mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Real Results
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            From selfie to studio.
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            No photoshop. No professional lighting. Just everyday selfies transformed into stunning, photorealistic corporate headshots.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--lime-border)] transition-colors group flex flex-col">
              <div className="mb-4">
                <ComparisonSlider before={ex.before} after={ex.after} />
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border)]">
                <div>
                  <div className="text-sm font-bold text-[var(--text)]">{ex.style}</div>
                  <div className="text-xs text-[var(--text-faint)]">{ex.plan} Plan</div>
                </div>
                <Link 
                  href={`/upload?style=${ex.style.toLowerCase()}`}
                  className="text-xs font-bold bg-[var(--surface2)] hover:bg-[var(--lime)] hover:text-black text-[var(--text-muted)] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Get this look
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Ready to upgrade your profile?</h2>
          <p className="text-[var(--text-muted)] mb-8">Join thousands of professionals who have already transformed their digital presence.</p>
          <Link href="/upload" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Create my headshots — $29 <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
