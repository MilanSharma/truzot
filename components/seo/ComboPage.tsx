import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { Profession } from "@/lib/seo-data/professions";
import type { City } from "@/lib/seo-data/cities";
export default function ComboPage({
 profession,
 city,
}: {
 profession: Profession;
 city: City;
}) {
 return (
 <div className="min-h-screen bg-[var(--bg-primary)]">
 <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white -[var(--bg-primary)]">
 <div className="max-w-5xl mx-auto text-center">
 <div className="inline-flex items-center rounded-full border border-[var(--lime-border)] bg-[var(--lime-dim)]/50 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
 <MapPin className="w-4 h-4 mr-2" /> Top Rated in {city.name},{" "}
 {city.state}
 </div>
 <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
 The Best {profession.name} Headshots in {city.name}
 </h1>
 <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto mb-10">
 {profession.description}. Skip the expensive {city.name} photography
 studios. Get perfect, AI-generated headshots from home in just 30
 minutes.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link
 href="/upload"
 className="bg-[var(--lime)] text-black text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
 >
 Generate Your Headshots <ArrowRight className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </section>
 </div>
 );
}
