"use client";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Users,
  Clock,
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
  Heart,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PLANS } from "@/lib/plans";
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

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "VP of Product",
    text: "The quality is indistinguishable from the $800 studio session I did last year. My entire team now uses Truzot for our company directory.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Working Actor",
    text: "I needed commercial and theatrical looks for my comp card. Truzot gave me incredible variety without having to pay for multiple wardrobe changes at a studio.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Real Estate Broker",
    text: "In real estate, trust is everything. These photos gave me a polished, premium look that immediately elevated my listings and marketing materials.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Recent Graduate",
    text: "Updated my resume and LinkedIn in 10 minutes. Got 3x more profile views in the first week. Worth every penny for the job search.",
    rating: 5,
  },
  {
    name: "Jessica T.",
    role: "Dating Profile",
    text: "I just wanted some nice, natural-looking photos for Hinge that didn't look like mirror selfies. The 'Casual' and 'Outdoor' styles were perfect.",
    rating: 5,
  },
  {
    name: "Michael B.",
    role: "Startup Founder",
    text: "Used these for my pitch deck and press kit. Investors actually complimented the photography. They had no idea it was AI.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Do these actually look like me?",
    a: "Yes. Unlike early AI filters that made everyone look like plastic dolls, our proprietary LoRA pipeline learns your exact facial geometry, skin texture, and micro-expressions. The results are indistinguishable from real photography.",
  },
  {
    q: "Is this only for business professionals?",
    a: "Not at all! While many use us for LinkedIn, we have dedicated style engines for Actors (theatrical/commercial), Models (comp cards), Dating profiles (casual/natural), and Creators.",
  },
  {
    q: "How many photos do I need to upload?",
    a: "Just 1 to 5 casual selfies. Photos taken from your phone in natural lighting work perfectly. We handle the rest.",
  },
  {
    q: "What if I'm not happy with the results?",
    a: "We offer a strict 30-day, 100% money-back guarantee. If you don't absolutely love your photos, just click 'Request Refund' in your dashboard. No questions asked.",
  },
  {
    q: "Are my photos private?",
    a: "Yes. We use AES-256 encryption. Your uploaded selfies and the trained AI model are permanently purged from our servers 30 days after your order is complete. We NEVER use your face to train public models.",
  },
];

export default function LandingPageContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-50 border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              TRUZOT
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a
                href="#who-its-for"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                Use Cases
              </a>
              <a
                href="#how-it-works"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                How It Works
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
                Create Photos
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
              <a href="#who-its-for" onClick={() => setMobileMenuOpen(false)}>
                Use Cases
              </a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
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
                Create Photos
              </Link>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Truzot Enterprise AI 2.0 Now Available
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tighter mb-6 text-slate-900 dark:text-white leading-[1.05]">
            Stunning Photography. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              Generated in Minutes.
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Upload a few casual selfies and let our proprietary AI generate
            breathtaking, photorealistic portraits. Built for actors, models,
            founders, and everyday professionals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
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

          <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 mb-16">
            <div className="flex -space-x-3">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className={`relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 z-${10 - i} overflow-hidden bg-slate-200`}
                >
                  <Image
                    src={src}
                    alt="User"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start ml-2 text-left">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="font-semibold text-xs mt-0.5">
                Trusted by 10,000+ people
              </span>
            </div>
          </div>

          <div className="mt-12 w-full mx-auto relative z-10">
            <BeforeAfterCarousel examples={BEFORE_AFTER_EXAMPLES} />
          </div>
        </section>

        {/* Use Cases Section (Broadening Audience) */}
        <section
          id="who-its-for"
          className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                One tool. Infinite possibilities.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                Select your preferred style during upload. We automatically
                adapt lighting, poses, and backgrounds to match your exact
                needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <Linkedin className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">LinkedIn & Corporate</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Crisp, professional headshots that increase recruiter messages
                  by 36x. Perfect for resumes and company websites.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <Camera className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Actors & Models</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Build a versatile comp card. Get theatrical and commercial
                  looks without paying for multiple wardrobe changes at a
                  studio.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <Heart className="w-10 h-10 text-rose-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Dating & Social</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Natural, flattering photos in outdoor and casual settings that
                  look authentic, not artificially generated.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <Briefcase className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Startup Founders</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Authoritative, modern portraits for pitch decks, press
                  releases, and speaking engagements.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <GraduationCap className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Students & Grads</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Kickstart your career on a budget. Get premium quality photos
                  before your first post-grad interview.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <Users className="w-10 h-10 text-amber-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Real Estate & Sales</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Warm, trustworthy, client-facing photos that build immediate
                  credibility on your marketing materials.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Box: How It Works & Privacy */}
        <section
          id="how-it-works"
          className="py-24 px-6 bg-[var(--bg-primary)]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Engineered for Excellence
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                The fastest way to achieve a premium brand. No travel, no
                awkward posing, no waiting weeks for edits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2">
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

              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Rapid Generation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Grab a coffee. In as little as 30 minutes, your custom AI
                  model renders dozens of studio-grade photos.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  3. Professional Polish
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Download 4K resolution photos optimized for any
                  platform—social media, printing, or web.
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
                <div className="flex flex-wrap items-center gap-4 z-10">
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg">
                    <Shield className="w-4 h-4" /> SOC-2 Aligned
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg">
                    <Lock className="w-4 h-4" /> AES-256 Encryption
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" /> Auto-Delete in 30 Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Slider */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-extrabold tracking-tight mb-6">
                Indistinguishable from reality.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                We&apos;ve tuned our algorithms to avoid the &quot;AI
                look&quot;. Skin texture, authentic lighting, and natural eye
                contact ensure your photos look like they were taken by a
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

        {/* Wall of Love (Testimonials) */}
        <section
          id="testimonials"
          className="py-24 px-6 bg-[var(--bg-primary)]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">
                Real users. Real success.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                Don&apos;t just take our word for it. See what others are
                saying.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={18} className="fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 text-base leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {t.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-24 bg-slate-50 dark:bg-slate-900/50 px-6 border-y border-slate-200 dark:border-slate-800"
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
                        : "actors and executives"}
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

        {/* FAQ SECTION ON LANDING PAGE */}
        <section className="py-24 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 text-left font-bold flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                  >
                    {faq.q}
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-90" : ""}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/faq"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Read more FAQs →
              </Link>
            </div>
          </div>
        </section>

        {/* Affiliate CTA */}
        <section className="bg-slate-900 dark:bg-slate-950 text-white py-20 px-6 mx-4 md:mx-auto max-w-7xl rounded-[3rem] shadow-2xl mb-24">
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
        <section className="py-24 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-5xl mx-auto bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight relative z-10">
              You deserve a breathtaking portrait.
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
              Join thousands of people who have elevated their personal brand
              with Truzot. Takes 2 minutes to set up.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-xl relative z-10"
            >
              Get Professional Headshots <ArrowRight className="w-5 h-5" />
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
                High-end AI photography generation for everyone. Studio quality
                without the studio.
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
                    Create Photos
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
                      placeholder="name@email.com"
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
