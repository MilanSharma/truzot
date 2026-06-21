"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Camera, Sparkles, Globe, Shield, Zap, TrendingUp } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Nav showBack />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center rounded-full border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-8 shadow-sm relative z-10">
          <Sparkles className="w-4 h-4 mr-2" /> Our Mission
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white leading-[1.1] relative z-10">
          Democratizing high-end <br className="hidden md:block" /> photography
          for everyone.
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto relative z-10">
          Whether you&apos;re an actor landing an audition, a founder raising
          capital, or a professional updating your LinkedIn—you deserve to look
          your absolute best without paying $500 for a studio.
        </p>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">
              10k+
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Customers
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">
              1.2M+
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Photos Generated
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">
              2 min
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Upload Time
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">
              4.9/5
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Average Rating
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div className="bg-slate-100 dark:bg-slate-900 aspect-square rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80')] bg-cover bg-center opacity-90 mix-blend-luminosity hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex items-end p-10">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  The old way is broken.
                </h3>
                <p className="text-slate-300 font-medium">
                  It&apos;s time for an upgrade.
                </p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-slate-900 dark:text-white">
              The $500 studio problem.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              For decades, professional photography has been locked behind a
              wall of expensive equipment, rented studios, and hours of manual
              retouching. It cost hundreds of dollars, required awkward posing,
              and took weeks to get results.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Truzot was built to change that. We leverage state-of-the-art
              generative AI (fine-tuned Flux LoRA architecture) to analyze your
              facial geometry from everyday selfies and render breathtaking,
              photorealistic portraits in minutes.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Globe className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Accessible to Everyone
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              From Fortune 500 CEOs to aspiring actors and everyday job seekers.
              Great photos open doors, and everyone deserves the key.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Studio Quality
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We don&apos;t do cheap filters. Our engine renders precise
              volumetric lighting, authentic skin textures, and natural depth of
              field.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Privacy First
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your face is your data. We encrypt your uploads, train isolated
              models, and automatically purge everything after 30 days.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 border border-slate-800">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
              Ready to see yourself in a new light?
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Join over 10,000 people who have transformed their personal brand,
              landed jobs, and grown their businesses with Truzot.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Link
              href="/upload"
              className="inline-block bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Create Your Photos Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
