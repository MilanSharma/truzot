"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Camera, Sparkles, Globe, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Nav showBack />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center rounded-full border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 mr-2" /> Our Mission
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white">
          Democratizing high-end <br className="hidden md:block" /> photography
          for everyone.
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Whether you&apos;re an actor landing an audition, a founder raising
          capital, a student graduating, or someone looking for love online—you
          deserve to look your absolute best.
        </p>
      </section>

      {/* Content */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="bg-slate-100 dark:bg-slate-900 aspect-square rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80')] bg-cover bg-center opacity-90 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
              <h3 className="text-2xl font-bold text-white">
                The old way is broken.
              </h3>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 tracking-tight">
              The $500 studio problem.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              For decades, professional photography has been locked behind a
              wall of expensive equipment, rented studios, and hours of manual
              retouching. It cost hundreds of dollars and took weeks to get
              results.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Truzot was built to change that. We leverage state-of-the-art
              generative AI (Flux LoRA) to analyze your facial geometry from
              everyday selfies and render breathtaking, photorealistic portraits
              in minutes.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-24">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Globe className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">For Everyone</h3>
            <p className="text-slate-600 dark:text-slate-400">
              From Fortune 500 CEOs to aspiring actors and everyday people.
              Great photos open doors.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Camera className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Studio Quality</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We don&apos;t do cheap filters. We render precise lighting,
              authentic skin textures, and natural environments.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Shield className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Privacy First</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your face is your data. We encrypt your uploads, train isolated
              models, and purge everything after 30 days.
            </p>
          </div>
        </div>

        <div className="text-center bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 relative z-10">
            Ready to see yourself in a new light?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
            Join over 10,000 people who have transformed their personal brand
            with Truzot.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl relative z-10"
          >
            Create Your Photos Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
