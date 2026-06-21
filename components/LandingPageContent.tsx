"use client";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Users,
  Clock,
  ChevronRight,
  Menu,
  X,
  Star,
  Briefcase,
  Linkedin,
  Camera,
  Mail,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PLANS, HEADSHOT_CATEGORIES } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import {
  ProductSchema,
  SpeakableSchema,
  BreadcrumbSchema,
} from "@/components/JsonLd";

const ComparisonSlider = dynamic(
  () => import("@/components/ComparisonSlider"),
  { ssr: false },
);
const BeforeAfterCarousel = dynamic(
  () => import("@/components/BeforeAfterCarousel"),
  { ssr: false },
);

const USE_CASES = [
  { name: "LinkedIn Profiles", icon: <Linkedin className="w-5 h-5" /> },
  { name: "Corporate Teams", icon: <Users className="w-5 h-5" /> },
  { name: "Executive Bios", icon: <Briefcase className="w-5 h-5" /> },
  { name: "Speaker Portfolios", icon: <Star className="w-5 h-5" /> },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "VP of Product, TechCorp",
    text: "The quality is indistinguishable from the $800 studio session I did last year. My entire team now uses Truzot for our company directory.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Managing Director",
    text: "I was skeptical of AI photography, but the results blew me away. It captured my likeness perfectly without the artificial 'plastic' look.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Real Estate Broker",
    text: "In real estate, trust is everything. These headshots gave me a polished, premium look that immediately elevated my marketing materials.",
    rating: 5,
  },
];

const BEFORE_AFTER_EXAMPLES = [
  { before: "/shots/girl1 - before.jpg", after: "/shots/girl1 - after.jpeg" },
  { before: "/shots/man1 - before.jpg", after: "/shots/man1 - after.jpeg" },
  { before: "/shots/girl2 - before.jpg", after: "/shots/girl2 - after.jpeg" },
  { before: "/shots/man2- before.jpg", after: "/shots/man2- after.jpeg" },
  { before: "/shots/girl3 - before.jpg", after: "/shots/girl3 - after.jpeg" },
  { before: "/shots/man3 - before.jpg", after: "/shots/man3 - after.jpeg" },
  { before: "/shots/girl4 - before.jpg", after: "/shots/girl4 - after.jpeg" },
  { before: "/shots/man4 - before.jpg", after: "/shots/man4 - after.jpeg" },
];

// Placeholder for corporate logos (SVGs)
const CompanyLogos = () => (
  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
    <div className="text-xl font-bold font-sans tracking-tight">Microsoft</div>
    <div className="text-xl font-bold font-serif tracking-tighter">Google</div>
    <div className="text-xl font-bold font-sans tracking-wide">amazon</div>
    <div className="text-xl font-extrabold font-sans">Meta</div>
    <div className="text-xl font-bold font-sans tracking-tighter">
      Salesforce
    </div>
  </div>
);

export default function LandingPageContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setIsAuthed(true);
    });

    const handleMouseLeave = (e: MouseEvent) => {
      const signedUp =
        localStorage.getItem("truzot-waitlist-signed-up") === "true";
      const dismissed =
        localStorage.getItem("truzot-exit-popup-dismissed") === "true";
      if (signedUp || dismissed) return;
      if (e.clientY <= 0) setShowExitPopup(true);
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const handleClosePopup = () => {
    setShowExitPopup(false);
    localStorage.setItem("truzot-exit-popup-dismissed", "true");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "exit-intent" }),
      });
      if (res.ok) {
        setSubmitStatus("success");
        setEmail("");
        localStorage.setItem("truzot-waitlist-signed-up", "true");
        setTimeout(() => setShowExitPopup(false), 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ProductSchema />
      <SpeakableSchema />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <div
        id="main-content"
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans scroll-smooth"
      >
        {/* Modern Navigation */}
        <nav className="fixed top-0 w-full bg-[var(--bg-primary)]/80 backdrop-blur-xl z-50 border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              TRUZOT
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a
                href="#how-it-works"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                How It Works
              </a>
              <a
                href="#examples"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                Gallery
              </a>
              <a
                href="#pricing"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                Pricing
              </a>
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/upload"
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-md"
              >
                Create Headshots
              </Link>
            </div>
            <button
              className="md:hidden text-slate-900 dark:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-primary)] py-4 px-6 flex flex-col gap-4 font-semibold shadow-2xl">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#examples" onClick={() => setMobileMenuOpen(false)}>
                Gallery
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-slate-900 text-white text-center px-5 py-3 rounded-lg mt-2"
              >
                Create Headshots
              </Link>
            </div>
          )}
        </nav>

        {/* Enterprise Hero Section */}
        <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Truzot Enterprise AI Model 2.0 Now Available
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white leading-[1.1]">
            Studio-Quality Headshots. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              Generated in Minutes.
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Elevate your professional presence without the hassle of a photo
            studio. Upload casual selfies and let our proprietary AI generate
            pristine, corporate-ready headshots trusted by Fortune 500
            professionals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              Get Professional Headshots <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#examples"
              className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center"
            >
              View Gallery
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-16">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 z-${5 - i}`}
                />
              ))}
            </div>
            <div className="flex items-center ml-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-2" />
              <span>Trusted by 5,000+ professionals</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Trusted by professionals at
          </p>
          <CompanyLogos />

          <div className="mt-24 w-full mx-auto">
            <BeforeAfterCarousel examples={BEFORE_AFTER_EXAMPLES} />
          </div>
        </section>

        {/* Bento Box: How It Works & Features */}
        <section
          id="how-it-works"
          className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Engineered for Excellence
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                The fastest way to achieve a premium professional brand. No
                travel, no awkward posing, no waiting weeks for edits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  1. Upload Casual Selfies
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                  Provide 1-5 everyday photos. Our AI analyzes your facial
                  geometry, skin tone, and expressions with surgical precision.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Rapid Generation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Grab a coffee. In as little as 30 minutes, your custom AI
                  model renders dozens of studio-grade photos.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  3. Professional Polish
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Download 4K resolution headshots optimized for LinkedIn,
                  company directories, and personal branding.
                </p>
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl col-span-1 md:col-span-2 text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
                <h3 className="text-3xl font-bold mb-4 z-10">
                  Strict Data Privacy
                </h3>
                <p className="text-slate-300 text-lg max-w-xl z-10 mb-6">
                  Your biometric data is securely processed in isolated
                  environments and permanently purged after 30 days. We never
                  train public models on your face.
                </p>
                <div className="flex items-center gap-4 z-10">
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg">
                    <Shield className="w-4 h-4" /> SOC-2 Aligned
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg">
                    <Lock className="w-4 h-4" /> AES-256 Encryption
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Slider */}
        <section
          id="examples"
          className="py-24 px-6 bg-[var(--bg-primary)] border-y border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-extrabold tracking-tight mb-6">
                Indistinguishable from reality.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                We&apos;ve tuned our algorithms to avoid the &quot;AI
                look&quot;. Skin texture, authentic lighting, and natural eye
                contact ensure your headshots look like they were taken by a
                high-end human photographer.
              </p>
              <ul className="space-y-4 font-semibold text-slate-700 dark:text-slate-300 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600" /> Authentic
                  skin textures and pores
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600" /> Perfected
                  studio lighting
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600" /> Accurate
                  eye tracking
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] -z-10 blur-xl" />
              <ComparisonSlider
                before="/shots/man5 - before.jpg"
                after="/shots/man5 - after.jpeg"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-24 bg-slate-50 dark:bg-slate-900/50 px-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">
                Transparent, one-time pricing
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                No subscriptions. 100% money-back guarantee if you&apos;re not
                fully satisfied.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {Object.values(PLANS).map((plan: any) => (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-slate-900 p-10 rounded-[2rem] border ${plan.popular ? "border-slate-900 dark:border-slate-100 shadow-2xl scale-105 z-10" : "border-slate-200 dark:border-slate-800 shadow-sm"} transition-transform flex flex-col`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm h-10">
                    Best for{" "}
                    {plan.id === "basic"
                      ? "quick updates"
                      : plan.id === "pro"
                        ? "complete profile overhauls"
                        : "executives and leaders"}
                    .
                  </p>

                  <div className="my-6">
                    <span className="text-5xl font-black tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {" "}
                      / one-time
                    </span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 font-medium">
                      <CheckCircle
                        size={20}
                        className="text-emerald-500 shrink-0"
                      />{" "}
                      {plan.shots} High-Res Headshots
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <CheckCircle
                        size={20}
                        className="text-emerald-500 shrink-0"
                      />{" "}
                      {plan.styles} Custom Styles
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <CheckCircle
                        size={20}
                        className="text-emerald-500 shrink-0"
                      />{" "}
                      {plan.resolution}
                    </li>
                    <li className="flex items-center gap-3 font-medium">
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

            <div className="mt-12 flex items-center justify-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Secured by Stripe
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> 30-Day Refund Guarantee
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-5xl mx-auto bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight relative z-10">
              Your career deserves a better portrait.
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
              Join thousands of professionals who have elevated their personal
              brand with Truzot. Takes 2 minutes to set up.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-xl relative z-10"
            >
              Create Your Headshots Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#0b0d10] border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-16 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                TRUZOT
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Enterprise-grade AI headshot generation. Professional
                photography, modernized.
              </p>
              <div className="flex gap-4">
                {/* Social icons could go here */}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">
                Product
              </h4>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <Link
                    href="/upload"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Create Headshots
                  </Link>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    href="/team"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    For Teams
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">
                Company
              </h4>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">
                Legal
              </h4>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium">
            <p>
              &copy; {new Date().getFullYear()} Truzot Inc. All rights reserved.
            </p>
            <p>Designed for professionals.</p>
          </div>
        </footer>
      </div>

      {/* Exit-Intent Popup */}
      {showExitPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={handleClosePopup}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 text-center animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <X size={24} />
            </button>
            {submitStatus === "success" ? (
              <div className="py-6">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Code Sent!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Check your inbox for your $5 discount.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-slate-900 dark:text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                    Wait! Take $5 Off
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Enter your email and we&apos;ll send you a $5 discount code
                    instantly.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium focus:ring-2 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Send My Discount"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
