"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Shield,
  Lock,
  Image as ImageIcon,
  Briefcase,
  Camera,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does the 100% money-back guarantee work?",
    a: "We are confident in our AI. If you are not completely satisfied with your headshots, simply request a refund from your dashboard within 14 days, and we will refund your payment in full. No questions asked.",
  },
  {
    q: "Do I get full commercial rights to the photos?",
    a: "Yes. Once generated, you own the photos. You can use them for LinkedIn, company websites, marketing materials, book covers, and any other commercial purpose without attribution.",
  },
  {
    q: "How many photos do I need to upload?",
    a: "You only need to upload 1 to 5 casual selfies. Our advanced AI model requires significantly fewer photos than older generators to capture your exact likeness.",
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. We use AES-256 encryption. Your uploaded selfies and the trained AI model are permanently purged from our servers 30 days after your order is complete. We never use your face to train public models.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Nav />
      <main className="pt-32 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center rounded-full border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-6 shadow-sm">
              <Lock className="w-4 h-4 mr-2" /> One-time payment. No
              subscriptions.
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white">
              Studio quality. Fraction of the cost.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get premium professional headshots without leaving your home.
              Backed by our 100% money-back guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
            {Object.values(PLANS).map((plan: any) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border transition-all duration-300 flex flex-col ${plan.popular ? "border-blue-600 dark:border-blue-500 shadow-2xl scale-105 z-10 ring-4 ring-blue-50 dark:ring-blue-900/20" : "border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm h-10">
                  Best for{" "}
                  {plan.id === "basic"
                    ? "quick updates"
                    : plan.id === "pro"
                      ? "complete profile overhauls"
                      : "executives and teams"}
                  .
                </p>

                <div className="my-8">
                  <span className="text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {" "}
                    / one-time
                  </span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle
                      size={22}
                      className="text-blue-600 dark:text-blue-500 shrink-0"
                    />
                    <span className="font-bold">{plan.shots}</span> High-Res
                    Photos
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle
                      size={22}
                      className="text-blue-600 dark:text-blue-500 shrink-0"
                    />
                    <span className="font-bold">{plan.styles}</span> Custom
                    Styles
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <ImageIcon size={22} className="text-slate-400 shrink-0" />
                    {plan.resolution}
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <Clock size={22} className="text-slate-400 shrink-0" />
                    {plan.turnaround} Delivery
                  </li>
                </ul>

                <Link
                  href={`/upload?plan=${plan.id}`}
                  className={`block w-full text-center py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-md ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/25" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          {/* Included in all plans */}
          <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 mb-24">
            <h3 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-white">
              Included in every package
            </h3>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  Commercial Rights
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Full ownership of your photos to use anywhere, forever.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  Total Privacy
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your photos are encrypted and auto-deleted after 30 days.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  Studio Match
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Results indistinguishable from a $500 photography session.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 text-left font-bold flex justify-between items-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
