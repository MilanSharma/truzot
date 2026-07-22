"use client";
import Link from "next/link";
import Image from "next/image";
import { Camera, Sparkles, Globe, Shield, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
 return (
 <div className="min-h-screen">
 {/* Nav */}
 <nav className="fixed top-0 w-full z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)]">
 <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
 <Link href="/" className="text-2xl font-black tracking-tighter text-[var(--text)]">
 TRUZOT<span className="ml-1.5 text-[10px] font-bold text-lime-400 align-super tracking-widest">AI</span>
 </Link>
 <Link href="/upload" className="bg-lime-400 text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-lime-300 transition shadow-lg shadow-lime-400/20">
 Get headshots
 </Link>
 </div>
 </nav>

 {/* Hero */}
 <section className="pt-32 pb-20 px-6">
 <div className="max-w-5xl mx-auto text-center">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
 <p className="text-xs font-bold text-lime-400 uppercase tracking-[0.2em] mb-4">Our Mission</p>
 <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--text)] mb-6">
 Democratizing professional photography
 </h1>
 <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
 Everyone deserves studio-quality headshots. We&apos;re making it accessible, affordable, and instant.
 </p>
 </motion.div>
 </div>
 </section>

 {/* Stats */}
 <section className="py-16 px-6 border-y border-[var(--border)]">
 <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
 {[
 { value: "10K+", label: "Professionals served" },
 { value: "1.2M+", label: "Headshots generated" },
 { value: "5 min", label: "Average delivery" },
 { value: "4.9/5", label: "Average rating" },
 ].map((stat, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="text-center"
 >
 <div className="text-4xl font-black text-[var(--text)] mb-1">{stat.value}</div>
 <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
 </motion.div>
 ))}
 </div>
 </section>

 {/* Content */}
 <section className="py-24 px-6">
 <div className="max-w-5xl mx-auto">
 <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
 <div>
 <h2 className="text-4xl font-black tracking-tight text-[var(--text)] mb-6">
 The $500 studio problem.
 </h2>
 <p className="text-lg text-[var(--text-muted)] mb-6 leading-relaxed">
 For decades, professional photography has been locked behind expensive equipment, rented studios, and hours of manual retouching.
 </p>
 <p className="text-lg text-[var(--text-muted)] leading-relaxed">
 Truzot leverages state-of-the-art generative AI to analyze your facial features from everyday selfies and render breathtaking, photorealistic portraits in minutes.
 </p>
 </div>
 <div className="relative aspect-square rounded-3xl overflow-hidden">
 <Image
 src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80&fit=crop"
 alt="Professional photography"
 fill
 className="object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
 </div>
 </div>

 <div className="grid md:grid-cols-3 gap-6">
 {[
 { icon: Globe, title: "Accessible to Everyone", desc: "From Fortune 500 CEOs to aspiring actors. Great photos open doors." },
 { icon: Camera, title: "Studio Quality", desc: "We render precise lighting, authentic skin textures, and natural depth of field." },
 { icon: Shield, title: "Privacy First", desc: "Your photos are encrypted and auto-deleted after 30 days. Always." },
 ].map(({ icon: Icon, title, desc }, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="p-8 rounded-2xl border"
 
 >
 <div className="w-12 h-12 bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-2xl flex items-center justify-center mb-5">
 <Icon className="w-6 h-6 text-lime-400" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text)] mb-3">{title}</h3>
 <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-24 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="rounded-3xl p-12 md:p-16 text-center bg-[var(--surface)] border border-[var(--lime-border)] shadow-sm">
 <h2 className="text-4xl font-black text-[var(--text)] mb-4 tracking-tight">
 Ready to see yourself in a new light?
 </h2>
 <p className="text-xl text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
 Join 10,000+ professionals who transformed their personal brand with Truzot.
 </p>
 <Link
 href="/upload"
 className="inline-flex items-center gap-2 bg-lime-400 text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-lime-300 transition shadow-[var(--shadow-md)] shadow-lime-400/20"
 >
 Create your headshots <ArrowRight className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="border-t border-[var(--border)] py-12 px-6">
 <div className="max-w-7xl mx-auto text-center text-sm text-[var(--text-faint)]">
 © {new Date().getFullYear()} Truzot Inc. All rights reserved.
 </div>
 </footer>
 </div>
 );
}
