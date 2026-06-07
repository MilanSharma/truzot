import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { CheckCircle, DollarSign, Share2, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Program — Truzot AI Headshots",
  description:
    "Join the Truzot Affiliate Program. Earn a 30% commission for every customer you refer.",
};

export default function AffiliatesPage() {
  const REWARDFUL_SIGNUP_URL =
    process.env.NEXT_PUBLIC_REWARDFUL_SIGNUP_URL || "/contact";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Earn <span className="text-emerald-400">30% Commission</span> on
            Every Sale
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join the Truzot Partner Program. Help professionals upgrade their
            personal brand with AI headshots and get paid for every referral.
          </p>
          <a
            href={REWARDFUL_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-500 transition shadow-xl"
          >
            Become an Affiliate Today
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            How it Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Simple, transparent, and built to help you succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              1. Share Your Link
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Get your unique affiliate link. Share it on your blog, YouTube
              channel, newsletter, or social media.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              2. They Purchase
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Your referrals click your link and purchase a Truzot headshot
              package. Our 60-day cookie ensures you get credited.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              3. You Get Paid
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Earn a flat 30% commission on the total sale value. Payments are
              made directly to your PayPal account every month.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Program Highlights
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "High conversion rate (~8-12%)",
              "Average order value of $45",
              "60-day cookie tracking window",
              "First-touch attribution",
              "Monthly payouts via PayPal",
              "Premium promotional assets provided",
              "Dedicated affiliate support",
              "Unlimited earning potential",
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
