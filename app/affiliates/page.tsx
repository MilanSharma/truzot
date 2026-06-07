import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  CheckCircle,
  DollarSign,
  Share2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Program — Truzot AI Headshots",
  description:
    "Join the Truzot Affiliate Program. Earn a 30% commission for every customer you refer.",
};

export default function AffiliatesPage() {
  const REWARDFUL_SIGNUP_URL =
    process.env.NEXT_PUBLIC_REWARDFUL_SIGNUP_URL || "/contact";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Nav />

      {/* Hero Section */}
      <div className="bg-slate-900 dark:bg-black text-white py-24 px-6 text-center border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Partner Program Now Open
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Earn <span className="text-emerald-400">30% Commission</span> on
            Every Sale
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Help professionals upgrade their personal brand with studio-quality
            AI headshots. Join the Truzot partner program and get paid for every
            referral.
          </p>
          <a
            href={REWARDFUL_SIGNUP_URL}
            target={
              REWARDFUL_SIGNUP_URL.startsWith("http") ? "_blank" : undefined
            }
            rel={
              REWARDFUL_SIGNUP_URL.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-500 transition shadow-xl hover:shadow-blue-900/20"
          >
            Become an Affiliate <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-4 text-sm text-slate-500">
            Free to join • Instant approval • 60-day cookies
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            How it Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We built our affiliate program to be simple, transparent, and highly
            profitable for creators, career coaches, and publishers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition hover:shadow-md">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              1. Share Your Link
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Sign up and grab your unique tracking link. Share it on your blog,
              YouTube channel, newsletter, LinkedIn, or social media.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition hover:shadow-md">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              2. They Purchase
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              When your referrals click your link and buy a Truzot headshot
              package, our 60-day cookie ensures you get credited for the sale.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition hover:shadow-md">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              3. You Get Paid
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Earn a flat 30% commission on the total sale value. Payments are
              made automatically to your PayPal account every month.
            </p>
          </div>
        </div>
      </div>

      {/* Program Benefits */}
      <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Program Highlights
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Why top affiliates choose to partner with Truzot.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "High conversion rate (~8-12%)",
              "Average order value of $45",
              "Earn up to $17.70 per referral",
              "60-day cookie tracking window",
              "Last-click attribution model",
              "Monthly payouts via PayPal",
              "Premium promotional assets provided",
              "Unlimited earning potential",
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a
              href={REWARDFUL_SIGNUP_URL}
              target={
                REWARDFUL_SIGNUP_URL.startsWith("http") ? "_blank" : undefined
              }
              rel={
                REWARDFUL_SIGNUP_URL.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition shadow-lg"
            >
              Sign Up for Free
            </a>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Already an affiliate?{" "}
              <a
                href="https://app.getrewardful.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Log in to your dashboard
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
