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
 title: "Affiliate Program — Earn 40% Commission",
 description:
 "Join the Truzot Affiliate Program and earn 40% commission on every sale. High conversion rate, 60-day cookies, monthly payouts. Perfect for creators, career coaches, and publishers.",
};
export default function AffiliatesPage() {
 const PROMOTEKIT_PORTAL_URL = "https://truzot.promotekit.com";
 return (
 <div className="min-h-screen bg-[var(--bg)] font-sans">
 <Nav />
 <div className="bg-slate-900 text-[var(--text)] py-24 px-6 text-center border-b border-slate-800">
 <div className="max-w-3xl mx-auto">
 <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
 Partner Program Now Open
 </div>
 <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
 Earn <span className="text-emerald-400">40% Commission</span> on
 Every Sale
 </h1>
 <p className="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto">
 Help professionals upgrade their personal brand with studio-quality
 AI headshots. Join the Truzot partner program and get paid for every
 referral.
 </p>
 <a
 href={PROMOTEKIT_PORTAL_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 bg-[var(--lime)] text-black text-[var(--text)] px-8 py-4 rounded-2xl text-lg font-bold hover:bg-blue-500 transition shadow-[var(--shadow-md)] hover:shadow-blue-900/20"
 >
 Become an Affiliate <ArrowRight className="w-5 h-5" />
 </a>
 <p className="mt-4 text-sm text-[var(--text-muted)]">
 Free to join • Instant approval • 60-day cookies
 </p>
 </div>
 </div>
 <div className="max-w-6xl mx-auto px-6 py-24">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
 How it Works
 </h2>
 <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
 We built our affiliate program to be simple, transparent, and highly
 profitable for creators, career coaches, and publishers.
 </p>
 </div>
 <div className="grid md:grid-cols-3 gap-8">
 <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm text-center transition hover:shadow-md">
 <div className="w-16 h-16 bg-[var(--lime-dim)] text-[var(--lime)] rounded-full flex items-center justify-center mx-auto mb-6">
 <Share2 className="w-8 h-8" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text)] mb-3">
 1. Share Your Link
 </h3>
 <p className="text-[var(--text-muted)] text-sm leading-relaxed">
 Sign up and grab your unique tracking link. Share it on your blog,
 YouTube channel, newsletter, LinkedIn, or social media.
 </p>
 </div>
 <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm text-center transition hover:shadow-md">
 <div className="w-16 h-16 bg-[var(--lime-dim)] text-[var(--lime)] rounded-full flex items-center justify-center mx-auto mb-6">
 <TrendingUp className="w-8 h-8" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text)] mb-3">
 2. They Purchase
 </h3>
 <p className="text-[var(--text-muted)] text-sm leading-relaxed">
 When your referrals click your link and buy a Truzot headshot
 package, our 60-day cookie ensures you get credited for the sale.
 </p>
 </div>
 <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm text-center transition hover:shadow-md">
 <div className="w-16 h-16 bg-[var(--lime-dim)] text-[var(--lime)] rounded-full flex items-center justify-center mx-auto mb-6">
 <DollarSign className="w-8 h-8" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text)] mb-3">
 3. You Get Paid
 </h3>
 <p className="text-[var(--text-muted)] text-sm leading-relaxed">
 Earn a flat 40% commission on the total sale value. Payments are
 made automatically to your PayPal account every month.
 </p>
 </div>
 </div>
 </div>
 <div className="bg-[var(--surface)] border-y border-[var(--border)] py-24 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
 Program Highlights
 </h2>
 <p className="text-[var(--text-muted)]">
 Why top affiliates choose to partner with Truzot.
 </p>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 {[
 "High conversion rate (~8-12%)",
 "Average order value of $45",
 "Earn up to $18 per referral",
 "60-day cookie tracking window",
 "Last-click attribution model",
 "Monthly payouts via PayPal",
 "Premium promotional assets provided",
 "Unlimited earning potential",
 ].map((benefit, i) => (
 <div
 key={i}
 className="flex items-center gap-4 bg-[var(--surface2)]/50 p-5 rounded-2xl border border-slate-100 "
 >
 <CheckCircle className="w-6 h-6 text-[var(--success)] shrink-0" />
 <span className="font-semibold text-[var(--text-muted)]">
 {benefit}
 </span>
 </div>
 ))}
 </div>
 <div className="mt-16 text-center">
 <a
 href={PROMOTEKIT_PORTAL_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 bg-[var(--lime)] text-black text-[var(--text)] px-8 py-4 rounded-2xl text-lg font-bold hover:bg-blue-700 transition shadow-lg"
 >
 Sign Up for Free
 </a>
 <p className="mt-4 text-sm text-[var(--text-muted)]">
 Already an affiliate?{" "}
 <a
 href={PROMOTEKIT_PORTAL_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[var(--lime)] hover:underline"
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
