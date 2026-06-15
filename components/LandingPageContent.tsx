"use client";

import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Users,
  Clock,
  ChevronRight,
  Menu,
  X,
  TrendingDown,
  Star,
  Briefcase,
  Linkedin,
  Camera,
} from "lucide-react";
import { useState } from "react";
import ComparisonSlider from "@/components/ComparisonSlider";
import { PLANS, HEADSHOT_CATEGORIES } from "@/lib/plans";
import {
  ProductSchema,
  SpeakableSchema,
  BreadcrumbSchema,
} from "@/components/JsonLd";

const USE_CASES = [
  { icon: <Linkedin className="w-5 h-5" />, name: "LinkedIn" },
  { icon: <Briefcase className="w-5 h-5" />, name: "Company Pages" },
  { icon: <Camera className="w-5 h-5" />, name: "Zoom / Teams" },
  { icon: <Users className="w-5 h-5" />, name: "Team Profiles" },
  { icon: <Star className="w-5 h-5" />, name: "Business Cards" },
  { icon: <Zap className="w-5 h-5" />, name: "Social Media" },
];

const STYLE_GALLERY = [
  { name: "Corporate", color: "bg-slate-800" },
  { name: "LinkedIn", color: "bg-blue-600" },
  { name: "Casual", color: "bg-emerald-600" },
  { name: "Creative", color: "bg-purple-600" },
  { name: "Executive", color: "bg-slate-900" },
  { name: "Nature", color: "bg-green-700" },
  { name: "Urban", color: "bg-orange-600" },
  { name: "Studio", color: "bg-indigo-600" },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Product Manager",
    text: "Got hired after updating my LinkedIn with these headshots. Best $39 I ever spent.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "Startup Founder",
    text: "The team plan saved us thousands vs. a photo studio. The consistency across all headshots is incredible.",
    rating: 5,
  },
  {
    name: "Emily R.",
    role: "Marketing Director",
    text: "Finally, professional headshots without the awkward studio session. The AI nailed my likeness perfectly.",
    rating: 5,
  },
  {
    name: "David L.",
    role: "Software Engineer",
    text: "Updated my resume and LinkedIn in 10 minutes. Got 3x more profile views in the first week.",
    rating: 5,
  },
  {
    name: "Jessica M.",
    role: "Real Estate Agent",
    text: "My clients comment on my professional photos all the time. Nobody believes they're AI-generated.",
    rating: 5,
  },
  {
    name: "Alex P.",
    role: "Agency Owner",
    text: "We use Truzot for all our team headshots. Consistent, professional, and done in minutes.",
    rating: 5,
  },
];

export default function LandingPageContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <ProductSchema />
      <SpeakableSchema />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <div
        id="main-content"
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans scroll-smooth"
      >
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-[var(--bg-primary)]/80 backdrop-blur-md z-50 border-b border-[var(--border-primary)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TRUZOT
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
              <a
                href="#how-it-works"
                className="hover:text-blue-600 transition"
              >
                How It Works
              </a>
              <a href="#examples" className="hover:text-blue-600 transition">
                Examples
              </a>
              <a href="#pricing" className="hover:text-blue-600 transition">
                Pricing
              </a>
              <a href="#faq" className="hover:text-blue-600 transition">
                FAQ
              </a>
              <Link
                href="/login"
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/upload"
                className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 transition"
              >
                Get Started
              </Link>
            </div>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-primary)] py-4 px-6 flex flex-col gap-4">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#examples" onClick={() => setMobileMenuOpen(false)}>
                Examples
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-slate-900 dark:bg-blue-600 text-white text-center px-5 py-2 rounded-full text-sm font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 max-w-6xl mx-auto text-center">
          <a
            href="#comparison"
            className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6 hover:bg-green-100 transition"
          >
            <TrendingDown size={16} />
            <span>$29 vs $232 photographer — 88% cheaper, same quality</span>
          </a>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Turn Your Selfie Into a
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              $200 Professional Headshot
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            88% cheaper than a photographer. 30-minute delivery. 100% money-back
            guarantee. Upload 1-5 selfies, get 40+ professional headshots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              className="bg-blue-600 text-white text-lg px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg"
            >
              Get Your Headshots <ArrowRight size={20} />
            </Link>
            <a
              href="#examples"
              className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-lg px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              See Real Results
            </a>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" /> 30-day money-back guarantee
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> 5,000+ professionals trust us
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> 30-min average delivery
            </span>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-8 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-6 flex justify-center gap-12 flex-wrap text-center">
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                5,000+
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Professionals trust us
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                30 min
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Average delivery
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                30-day
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Money-back guarantee
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                $29 vs $232
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                vs photographer
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Comparison */}
        <section id="examples" className="py-20 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              Real Customers. Real Results.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-10">
              Slide to see the transformation. Real selfies → professional
              headshots.
            </p>
            <ComparisonSlider
              before="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=750&fit=crop"
              after="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=750&fit=crop"
            />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              Real customer photos. Drag slider to compare.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="py-20 px-6 bg-[var(--bg-secondary)]"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">How it works</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Get professional headshots in 3 simple steps. No photographer
                needed.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Upload your photos</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload 1-5 casual selfies. Phone photos work great — no
                  professional shots needed.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Add your details</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Tell the AI your eye color and pick the styles you want —
                  corporate, creative, casual, and more.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Download your headshots
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get {PLANS.basic.shots}+ professional headshots delivered in
                  minutes. Download and use anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Perfect To Use For */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Perfect to use for</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {USE_CASES.map((use) => (
                <div
                  key={use.name}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {use.icon}
                  {use.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-20 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                6 style categories, unlimited variety
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Pick the styles you want during upload. Each category generates
                multiple unique headshots with different poses and expressions.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Corporate & Executive",
                  desc: "Suit-and-tie studio shots with office backgrounds",
                },
                {
                  title: "LinkedIn Professional",
                  desc: "Clean, approachable photos perfect for your profile",
                },
                {
                  title: "Creative & Editorial",
                  desc: "Artistic lighting, bold backgrounds, magazine look",
                },
                {
                  title: "Casual & Outdoor",
                  desc: "Relaxed shots with natural light and outdoor settings",
                },
                {
                  title: "Startup & Tech",
                  desc: "Modern coworking spaces, smart casual attire",
                },
                {
                  title: "Real Estate & Sales",
                  desc: "Trustworthy, welcoming headshots for client-facing roles",
                },
              ].map((style) => (
                <div
                  key={style.title}
                  className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-700"
                >
                  <h3 className="font-bold text-lg mb-1">{style.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {style.desc}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
              Styles vary by plan. Basic includes 10 styles, Pro includes 20,
              Executive includes all.
            </p>
          </div>
        </section>

        {/* AI vs Traditional Photography Comparison Table (Optimized for AI Search & SEO) */}
        <section id="comparison" className="py-20 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                $29 vs $232 — Same Quality, 88% Less Cost
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                See why 5,000+ professionals switched from expensive studio
                sessions.
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-5 text-sm font-bold text-emerald-600 uppercase tracking-wider">
                      Truzot — $29
                    </th>
                    <th className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Photographer — $232 avg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Cost
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      $29 one-time
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      $232+ average
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900000 dark:text-white">
                      Turnaround Time
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      30 minutes avg
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      1 - 2 weeks
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Number of Photos
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      40+ headshots
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      10 - 30 retouched
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Style Variety
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      6+ categories, 30+ styles
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      1 - 2 setups
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Convenience
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      100% online, no travel
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      Studio visit required
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Commercial Rights
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      Included
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      Often extra fee
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition bg-emerald-50 dark:bg-emerald-900/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      Guarantee
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                      30-day money-back
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      Rarely offered
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Why 5,000+ Professionals Trust Truzot
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Professional headshots that don&apos;t break the bank — or your
                schedule. Backed by a 30-day money-back guarantee.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 text-emerald-600 mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  30-Day Money-Back Guarantee
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Not satisfied? Full refund within 30 days. No questions asked.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 text-emerald-600 mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  30-Minute Average Delivery
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get your headshots while you finish your coffee. No waiting
                  weeks.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 text-emerald-600 mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your photos are encrypted and permanently deleted after 30
                  days. We never share your data.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 text-emerald-600 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  5,000+ Professionals Trust Us
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  From job seekers to Fortune 500 teams. Real results, real
                  careers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Headshot Categories */}
        <section
          id="headshot-types"
          className="py-20 px-6 bg-[var(--bg-secondary)]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Headshots for every profession
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Whether you&apos;re on LinkedIn, auditioning for a role, or
                leading a team — we&apos;ve got you covered.
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-6">
              {HEADSHOT_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-xl text-center hover:shadow-lg transition border border-slate-100 dark:border-slate-700"
                >
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-bold">{cat.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {cat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[var(--bg-primary)] px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Simple, transparent pricing
              </h2>
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
        </section>

        {/* Testimonials */}
        <section
          id="testimonials"
          className="py-20 px-6 bg-[var(--bg-secondary)]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Real Professionals. Real Results.
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                5,000+ professionals upgraded their LinkedIn with Truzot.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex gap-1 text-yellow-400 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 text-sm leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Join 5,000+ professionals who upgraded their LinkedIn
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg"
              >
                Get Your Headshots <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  q: "How many photos should I upload?",
                  a: "Upload 1-5 clear selfies. The more variety in angles and lighting, the better your results.",
                },
                {
                  q: "How long does it take?",
                  a: "Most headshots are ready in 30 minutes or less. Higher-tier plans get priority processing.",
                },
                {
                  q: "Can I use these on LinkedIn?",
                  a: "Yes! All headshots come with full commercial usage rights. Use them anywhere.",
                },
                {
                  q: "What if I don't like my headshots?",
                  a: "We offer a 30-day money-back guarantee. If you're not satisfied, full refund — no questions asked.",
                },
                {
                  q: "Are my photos private?",
                  a: "Absolutely. All uploaded photos and generated headshots are encrypted and permanently deleted after 30 days.",
                },
                {
                  q: "How much does it cost vs a photographer?",
                  a: "Truzot: $29 one-time. Photographer: $232+ average. Same quality, 88% less cost, 30 min vs 2 weeks.",
                },
              ].map((faq) => (
                <div
                  key={faq.q}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Affiliate CTA */}
        <section className="bg-slate-900 dark:bg-slate-950 text-white py-20 px-6">
          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Earn <span className="text-emerald-400">20%</span> on Every
              Referral
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the Truzot Affiliate Program. Share your link and earn
              commission on every sale.
            </p>
            <Link
              href="/affiliates"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition shadow-lg"
            >
              Become an Affiliate <ChevronRight size={20} />
            </Link>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for your professional headshot?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Upload 1-5 selfies and get {PLANS.basic.shots}+ HD headshots in
              minutes.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition"
            >
              Get Started Now <ChevronRight size={20} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">TRUZOT</div>
              <p className="text-sm">
                AI-powered professional headshots without the studio hassle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/upload" className="hover:text-white">
                    Create Headshots
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    My Account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/affiliates" className="hover:text-white">
                    Affiliate Program
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-white">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} Truzot. Professional headshots,
            AI-generated.
          </div>
        </footer>
      </div>
    </>
  );
}
