"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";
import Link from "next/link";
import { CheckCircle, Clock, Shield, Lock } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Nav />
      <main className="pt-32 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white">
              Transparent, one-time pricing
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              No subscriptions. No hidden fees. 100% money-back guarantee if
              you&apos;re not fully satisfied with your photos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.values(PLANS).map((plan: any) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-900 p-10 rounded-[2rem] border ${plan.popular ? "border-slate-900 dark:border-slate-100 shadow-2xl scale-105 z-10" : "border-slate-200 dark:border-slate-800 shadow-sm"} transition-transform flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
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
                      : "actors and executives"}
                  .
                </p>

                <div className="my-6">
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
                      size={20}
                      className="text-emerald-500 shrink-0"
                    />{" "}
                    {plan.shots} High-Res Photos
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle
                      size={20}
                      className="text-emerald-500 shrink-0"
                    />{" "}
                    {plan.styles} Custom Styles
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle
                      size={20}
                      className="text-emerald-500 shrink-0"
                    />{" "}
                    {plan.resolution}
                  </li>
                  <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                    <Clock size={20} className="text-indigo-500 shrink-0" />{" "}
                    {plan.turnaround} Delivery
                  </li>
                </ul>

                <Link
                  href={`/upload?plan=${plan.id}`}
                  className={`block w-full text-center py-4 rounded-xl font-bold text-lg transition ${plan.popular ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                >
                  Select {plan.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" /> Secured by Stripe
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> 30-Day Money-Back
              Guarantee
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
