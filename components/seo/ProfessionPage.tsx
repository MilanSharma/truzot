import Link from "next/link";
import { CheckCircle, ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Profession } from "@/lib/seo-data/professions";
import { CITIES } from "@/lib/seo-data/cities";
import RelatedPages from "./RelatedPages";
interface ProfessionPageProps {
 profession: Profession;
}
export default function ProfessionPage({ profession }: ProfessionPageProps) {
 return (
 <div className="min-h-screen bg-[var(--bg-primary)]">
 <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white -[var(--bg-primary)]">
 <div className="max-w-5xl mx-auto text-center">
 <div className="inline-flex items-center rounded-full border border-[var(--lime-border)]/60 bg-[var(--lime-dim)]/50 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
 <Sparkles className="w-4 h-4 mr-2" /> AI-Powered {profession.name}{" "}
 Headshots
 </div>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
 {profession.title} in Minutes
 </h1>
 <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto mb-10">
 {profession.description}. Get professional-quality headshots
 starting at just $29. No photographer needed.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
 <Link
 href="/upload"
 className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:bg-slate-100 transition shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
 >
 Generate {profession.name} Headshots{" "}
 <ArrowRight className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </section>
 <section className="py-16 px-6 border-t border-[var(--border)] bg-white ">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-2xl font-bold mb-8 text-center text-[var(--text)]">
 Top Cities for {profession.name} Headshots
 </h2>
 <div className="flex flex-wrap justify-center gap-3">
 {CITIES.slice(0, 15).map((c) => (
 <Link
 key={c.id}
 href={`/headshots/${profession.id}-in-${c.id}`}
 className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-full text-sm font-medium text-[var(--text-muted)] hover:border-blue-500 hover:text-[var(--lime)] transition"
 >
 {profession.name} in {c.name}
 </Link>
 ))}
 </div>
 </div>
 </section>
 <RelatedPages currentType="profession" currentId={profession.id} />
 </div>
 );
}
