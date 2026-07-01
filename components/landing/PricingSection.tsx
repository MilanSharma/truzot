"use client";
import Link from "next/link";
import { Check, Flame, Sparkles, Lock, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS } from "@/lib/plans";

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

interface PricingSectionProps {
  recentOrderIdx: number;
  RECENT_ORDERS: string[];
}

export default function PricingSection({ recentOrderIdx, RECENT_ORDERS }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-24 px-6 bg-[var(--surface)] border-y border-[var(--border)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-[var(--lime)] uppercase tracking-[0.2em] mb-4">Transparent Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text)] mb-4">What $500 buys vs what $39 buys.</h2>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto">One-time payment. No subscriptions. Backed by our 30-day money-back guarantee.</p>
        </div>

        <div className="max-w-4xl mx-auto mb-16 bg-[var(--bg)] border border-[var(--border)] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[var(--shadow-lg)]">
           <div className="flex-1">
             <h3 className="text-xl font-bold mb-2">Traditional Studio Session</h3>
             <ul className="text-sm text-[var(--text-muted)] space-y-2">
               <li>❌ $400 - $800 average cost</li>
               <li>❌ 2-4 weeks turnaround</li>
               <li>❌ 1 outfit, 1 background</li>
             </ul>
           </div>
           <div className="hidden md:block w-px h-24 bg-[var(--border)]"></div>
           <div className="flex-1">
             <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--lime)]"/> Truzot AI</h3>
             <ul className="text-sm text-[var(--text-muted)] space-y-2">
               <li>✅ $39 one-time</li>
               <li>✅ Under 1 hour turnaround</li>
               <li>✅ Dozens of outfits & backgrounds</li>
             </ul>
           </div>
           <div className="bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-2xl p-4 text-center shrink-0">
              <div className="text-sm font-bold text-[var(--lime)] mb-1">You Save</div>
              <div className="text-3xl font-black text-[var(--text)]">~$461</div>
           </div>
        </div>

        <div className="max-w-5xl mx-auto mb-6 text-center h-6">
          <AnimatePresence mode="wait">
            <motion.p key={recentOrderIdx} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="text-sm font-bold text-[var(--text-faint)] flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-[var(--warning)]" /> {RECENT_ORDERS[recentOrderIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {Object.values(PLANS).map((plan) => (
            <motion.div key={plan.id} variants={fadeUp} className={`relative p-9 rounded-3xl border flex flex-col transition-all ${plan.popular ? "bg-[var(--surface2)] border-[var(--lime-border)] scale-[1.02] z-10 shadow-[var(--shadow-lime)]" : "bg-[var(--bg)] border-[var(--border)]"}`}>
              {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--lime)] text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5"><Flame className="w-3 h-3" /> Most popular</div>}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--text)] mb-1">{plan.name}</h3>
                <p className="text-[var(--text-muted)] text-sm">{plan.id === "basic" ? "Quick profile refresh" : plan.id === "pro" ? "Full brand overhaul" : "Executive & team use"}</p>
              </div>
              <div className="mb-7"><span className="text-5xl font-black text-[var(--text)] tabular-nums">${plan.price}</span><span className="text-[var(--text-muted)] font-medium"> one-time</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {[`${plan.shots} high-resolution photos`, `${plan.styles} custom styles`, plan.resolution, `${plan.turnaround} delivery`, "Commercial rights", "30-day guarantee"].map((feat, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm font-medium text-[var(--text)]"><Check className="w-4 h-4 text-[var(--lime)] shrink-0" /> {feat}</li>
                ))}
              </ul>
              <Link href={`/upload?plan=${plan.id}`} className={`block w-full text-center py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 ${plan.popular ? "btn-primary" : "btn-secondary"}`}>
                Get {plan.name}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
