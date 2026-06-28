import Link from "next/link";
import { CheckCircle, ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Style } from "@/lib/seo-data/styles";
import RelatedPages from "./RelatedPages";
interface StylePageProps {
  style: Style;
}
export default function StylePage({ style }: StylePageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-purple-200/60 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-purple-700 dark:text-purple-300 mb-6">
            <Sparkles className="w-4 h-4 mr-2" /> {style.name} Style
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {style.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10">
            {style.description}. Perfect for {style.useCase.toLowerCase()}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xl flex items-center justify-center gap-2"
            >
              Generate {style.name} Headshots <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      <RelatedPages currentType="style" currentId={style.id} />
    </div>
  );
}
