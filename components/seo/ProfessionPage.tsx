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
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-6">
            <Sparkles className="w-4 h-4 mr-2" /> AI-Powered {profession.name}{" "}
            Headshots
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {profession.title} in Minutes
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10">
            {profession.description}. Get professional-quality headshots
            starting at just $29. No photographer needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xl flex items-center justify-center gap-2"
            >
              Generate {profession.name} Headshots{" "}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">
            Top Cities for {profession.name} Headshots
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.slice(0, 15).map((c) => (
              <Link
                key={c.id}
                href={`/headshots/${profession.id}-in-${c.id}`}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition"
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
