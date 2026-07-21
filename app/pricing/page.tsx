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
    a: "We are confident in our AI. If you are not completely satisfied with your headshots, simply request a refund from your dashboard within 30 days, and we will refund your payment in full. No questions asked.",
  },
  {
    q: "Do I get full commercial rights to the photos?",
    a: "Yes. Once generated, you own the photos. You can use them for LinkedIn, company websites, marketing materials, book covers, and any other commercial purpose without attribution.",
  },
  {
    q: "How many photos do I need to upload?",
    a: "You can upload as few as 2 casual selfies, though we recommend 6–10 varied photos (different angles, lighting, and expressions) for the most accurate likeness. That's still far fewer than the 15–25 older generators require.",
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. We use AES-256 encryption. Your uploaded selfies and the trained AI model are permanently purged from our servers 30 days after your order is complete. We never use your face to train public models.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen font-sans text-white" style={{ background: "#07080A" }}>
      <Nav />
      <main className="pt-32 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-1.5 text-sm font-semibold text-lime-400 mb-6 shadow-sm">
              <Lock className="w-4 h-4" /> One-time payment. No subscriptions.
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-white">
              Studio quality. Fraction of the cost.
            </h1>
            <p className="text-xl text-white/40 max-w-2xl mx-auto">
              Get premium professional headshots without leaving your home.
              Backed by our 100% money-back guarantee.
            </p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
            {Object.values(PLANS).map((plan: any) => (
              <div
                key={plan.id}
                className={`relative p-10 rounded-[2.5rem] border transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? "border-lime-400/40 shadow-2xl scale-105 z-10 ring-1 ring-lime-400/20"
                    : "border-white/10 shadow-lg hover:shadow-xl"
                }`}
                style={{ background: "#0E1016" }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                <p className="text-white/40 text-sm h-10">
                  Best for{" "}
                  {plan.id === "basic"
                    ? "quick updates"
                    : plan.id === "pro"
                    ? "complete profile overhauls"
                    : "executives and teams"}
                  .
                </p>

                <div className="my-8">
                  <span className="text-6xl font-black tracking-tight text-white">
                    ${plan.price}
                  </span>
                  <span className="text-white/40 font-medium"> / one-time</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 font-medium text-white/50">
                    <CheckCircle size={22} className="text-lime-400 shrink-0" />
                    <span className="font-bold">{plan.shots}</span> High-Res Photos
                  </li>
                  <li className="flex items-center gap-3 font-medium text-white/50">
                    <CheckCircle size={22} className="text-lime-400 shrink-0" />
                    <span className="font-bold">{plan.styles}</span> Custom Styles
                  </li>
                  <li className="flex items-center gap-3 font-medium text-white/50">
                    <ImageIcon size={22} className="text-white/30 shrink-0" />
                    {plan.resolution}
                  </li>
                  <li className="flex items-center gap-3 font-medium text-white/50">
                    <Clock size={22} className="text-white/30 shrink-0" />
                    {plan.turnaround} Delivery
                  </li>
                </ul>

                <Link
                  href={`/upload?plan=${plan.id}`}
                  className={`block w-full text-center py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
                    plan.popular
                      ? "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/20"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          {/* Included in all plans */}
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-white/10 p-8 md:p-12 mb-24" style={{ background: "#0E1016" }}>
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              Included in every package
            </h3>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-400/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Commercial Rights</h4>
                <p className="text-sm text-white/40">
                  Full ownership of your photos to use anywhere, forever.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-400/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Total Privacy</h4>
                <p className="text-sm text-white/40">
                  Your photos are encrypted and auto-deleted after 30 days.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2">Studio Match</h4>
                <p className="text-sm text-white/40">
                  Results indistinguishable from a $500 photography session.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-10 text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-white/10 rounded-2xl overflow-hidden"
                  style={{ background: "#0E1016" }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 text-left font-bold flex justify-between items-center text-white hover:bg-white/5 transition"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`w-5 h-5 text-white/40 transition-transform ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-white/40 leading-relaxed text-sm">
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