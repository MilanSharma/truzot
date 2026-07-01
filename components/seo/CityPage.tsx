import Link from "next/link";
import {
 CheckCircle,
 ArrowRight,
 Shield,
 Clock,
 Sparkles,
 MapPin,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { City } from "@/lib/seo-data/cities";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import RelatedPages from "./RelatedPages";
import { SITE_CONFIG } from "@/lib/seo";

interface CityPageProps {
 city: City;
}
export default function CityPage({ city }: CityPageProps) {
 
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Truzot AI Headshots ${city.name}`,
    "image": `${SITE_CONFIG.url}/logo.png`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": city.state,
      "addressCountry": "US"
    },
    "priceRange": "$$",
    "url": `${SITE_CONFIG.url}/city/${city.id}`
  };

  return (
 <div className="min-h-screen bg-[var(--bg-primary)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white -[var(--bg-primary)]">
 <div className="max-w-5xl mx-auto text-center">
 <div className="inline-flex items-center rounded-full border border-[var(--lime-border)]/60 bg-[var(--lime-dim)]/50 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
 <MapPin className="w-4 h-4 mr-2" /> Serving {city.name},{" "}
 {city.state}
 </div>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
 Professional Headshots in {city.name}, {city.state}
 </h1>
 <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto mb-10">
 Get studio-quality AI headshots without leaving {city.name}.
 Starting at just $29. Delivered in 30 minutes.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
 <Link
 href="/upload"
 className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:bg-slate-100 transition shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
 >
 Get {city.name} Headshots <ArrowRight className="w-5 h-5" />
 </Link>
 <Link
 href="/pricing"
 className="w-full sm:w-auto bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[var(--bg)] dark:bg-slate-800 transition shadow-sm flex items-center justify-center"
 >
 View Pricing
 </Link>
 </div>
 </div>
 </section>
 <section className="py-16 px-6 border-t border-[var(--border)] bg-white ">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-2xl font-bold mb-8 text-center text-[var(--text)]">
 Popular Headshot Services in {city.name}
 </h2>
 <div className="flex flex-wrap justify-center gap-3">
 {PROFESSIONS.map((p) => (
 <Link
 key={p.id}
 href={`/headshots/${p.id}-in-${city.id}`}
 className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-full text-sm font-medium text-[var(--text-muted)] hover:border-blue-500 hover:text-[var(--lime)] transition"
 >
 {p.name} Headshots in {city.name}
 </Link>
 ))}
 </div>
 </div>
 </section>
 <RelatedPages currentType="city" currentId={city.id} />
 </div>
 );
}
