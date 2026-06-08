"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Nav />
      <main className="pt-24 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              One-time payment. No subscriptions. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.values(PLANS).map((plan: any) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-900 p-8 rounded-2xl border ${plan.popular ? "border-blue-600 shadow-xl ring-2 ring-blue-50 dark:ring-blue-900 scale-105" : "border-slate-200 dark:border-slate-700"} transition hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-5xl font-black">${plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" "}
                    one-time
                  </span>
                </div>
                <div className="text-sm text-green-600 mb-6 font-medium">
                  ⚡ Ready in {plan.turnaround}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />{" "}
                    {plan.shots} HD Headshots
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />{" "}
                    {plan.styles} AI Styles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />{" "}
                    {plan.resolution}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />{" "}
                    Commercial usage rights
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" /> 100%
                    satisfaction guarantee
                  </li>
                </ul>
                <Link
                  href={`/upload?plan=${plan.id}`}
                  className={`block w-full text-center py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
