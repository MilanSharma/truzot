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
  Heart,
  GraduationCap,
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
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80",
  "https://images.unsplash.com/photo-1601233749202-95d04d5b3c00?w=100&h=100&fit=crop&q=80",
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "VP of Product @ TechFlow",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=200",
    text: "The quality is absolutely indistinguishable from the $800 studio session I did last year in NYC. My entire executive team now uses Truzot for our company directory.",
    rating: 5,
    verified: true,
  },
  {
    name: "Marcus Johnson",
    role: "Commercial Actor",
    image:
      "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=200",
    text: "I needed fresh commercial and theatrical looks for my comp card. Truzot gave me incredible variety without having to pay for multiple wardrobe changes and lighting setups.",
    rating: 5,
    verified: true,
  },
  {
    name: "Emily Rodriguez",
    role: "Principal Broker",
    image:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200",
    text: "In luxury real estate, trust is everything. These photos gave me a polished, high-end look that immediately elevated my listings and marketing materials.",
    rating: 5,
    verified: true,
  },
  {
    name: "David Park",
    role: "Software Engineer",
    image:
      "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?auto=format&fit=crop&q=80&w=200",
    text: "Updated my resume and LinkedIn in 10 minutes. Got 3x more profile views and two recruiter messages in the first week. Worth every penny for the job search.",
    rating: 5,
    verified: true,
  },
  {
    name: "Jessica Turner",
    role: "Creative Director",
    image:
      "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=200",
    text: "I was highly skeptical of AI photography, but the skin textures and lighting logic here are flawless. It captured my actual features perfectly.",
    rating: 5,
    verified: true,
  },
  {
    name: "Michael Brent",
    role: "Y Combinator Founder",
    image:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=200",
    text: "Used these for our Series A pitch deck and press kit. TechCrunch actually complimented the photography. They had absolutely no idea it was AI.",
    rating: 5,
    verified: true,
  },
];

const FAQS = [
  {
    q: "Do these actually look like me?",
    a: "Yes. Unlike early AI filters that made everyone look like plastic dolls, our advanced AI learns your exact facial geometry, skin texture, and micro-expressions. The results are indistinguishable from real photography.",
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

// Placeholder for modern B2B unicorn logos
const LOGOS = [
  { name: "Stripe", className: "font-sans font-bold tracking-tight text-2xl" },
  {
    name: "Google",
    className: "font-sans font-medium tracking-tighter text-2xl",
  },
  {
    name: "Microsoft",
    className: "font-sans font-semibold tracking-tight text-xl",
  },
  {
    name: "Amazon",
    className: "font-sans font-bold tracking-tighter text-2xl",
  },
  { name: "Meta", className: "font-sans font-semibold tracking-wide text-2xl" },
  {
    name: "Netflix",
    className: "font-sans font-black tracking-widest text-2xl",
  },
  {
    name: "Spotify",
    className: "font-sans font-bold tracking-tighter text-2xl",
  },
  { name: "Linear", className: "font-sans font-bold tracking-tight text-2xl" },
  { name: "Vercel", className: "font-sans font-extrabold text-2xl" },
];

const CompanyLogos = () => (
  <div
    className="w-full inline-flex flex-nowrap overflow-hidden py-4"
    style={{
      maskImage:
        "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      WebkitMaskImage:
        "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
    }}
  >
    <div className="flex w-max animate-marquee gap-12 md:gap-24 items-center justify-center">
      {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
        <div
          key={i}
          className={`text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-100 transition-opacity ${logo.className}`}
        >
          {logo.name}
        </div>
      ))}
    </div>
  </div>
);

const USE_CASES = [
  {
    title: "LinkedIn & Corporate",
    desc: "Crisp, professional headshots that increase recruiter messages by 36x. Perfect for resumes and company websites.",
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800",
    icon: Linkedin,
  },
  {
    title: "Actors & Models",
    desc: "Build a versatile comp card. Get theatrical and commercial looks without paying for multiple wardrobe changes at a studio.",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800",
    icon: Camera,
  },
  {
    title: "Dating & Social",
    desc: "Natural, flattering photos in outdoor and casual settings that look authentic, not artificially generated.",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800",
    icon: Heart,
  },
  {
    title: "Startup Founders",
    desc: "Authoritative, modern portraits for pitch decks, press releases, and speaking engagements.",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    icon: Briefcase,
  },
  {
    title: "Students & Grads",
    desc: "Kickstart your career on a budget. Get premium quality photos before your first post-grad interview.",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800",
    icon: GraduationCap,
  },
  {
    title: "Real Estate & Sales",
    desc: "Warm, trustworthy, client-facing photos that build immediate credibility on your marketing materials.",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800",
    icon: Users,
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
                Get Professional Headshots
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
                Get Professional Headshots
              </Link>
            </div>
          )}
        </nav>

        {/* Enterprise Hero Section */}
        <section className="pt-28 md:pt-32 pb-16 px-6 max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Truzot Enterprise AI 2.0 Now Available
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tighter mb-4 text-slate-900 dark:text-white leading-[1.1]">
            Studio-Quality Headshots <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              Generated in Minutes
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload a few casual selfies and let our advanced AI generate
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

          <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 mb-12">
            <div className="flex -space-x-3 items-center">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className={`relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 overflow-hidden bg-slate-200 shadow-sm ${["z-40", "z-30", "z-20", "z-10"][i] || "z-0"}`}
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
                Trusted by 10,000+ professionals
              </span>
            </div>
          </div>

          <div id="examples" className="mb-12 w-full mx-auto relative z-10">
            <BeforeAfterCarousel examples={BEFORE_AFTER_EXAMPLES} />
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">
            Trusted by professionals at
          </p>
          <CompanyLogos />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {USE_CASES.map((useCase, idx) => (
                <div
                  key={idx}
                  className="group relative h-[420px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 dark:border-slate-800"
                >
                  <Image
                    src={useCase.img}
                    alt={useCase.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90 transition-opacity" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-xl">
                      <useCase.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-200 font-medium leading-relaxed text-sm">
                      {useCase.desc}
                    </p>
                  </div>
                </div>
              ))}
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
              {/* Step 1: Takes exactly 1 column now */}
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  1. Upload Casual Selfies
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
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

              {/* Privacy box spans all 3 columns across the bottom */}
              <div className="bg-slate-900 dark:bg-slate-950 p-8 md:p-10 rounded-3xl border border-slate-800 shadow-xl col-span-1 md:col-span-3 text-white flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden gap-8 mt-2">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-bold mb-3">
                    Strict Data Privacy
                  </h3>
                  <p className="text-slate-300 text-lg mb-0 leading-relaxed">
                    Your biometric data is securely processed in isolated
                    environments and permanently purged after 30 days. We never
                    train public models on your face.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-3 rounded-xl w-full sm:w-auto">
                    <Shield className="w-4 h-4" /> SOC-2 Aligned
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-3 rounded-xl w-full sm:w-auto">
                    <Lock className="w-4 h-4" /> AES-256 Encryption
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
                Hear from our customers
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                Don&apos;t just take our word for it. See what others are
                saying.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 relative group overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-colors duration-500" />

                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-1.5 mb-6">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed font-medium mb-8">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-4 relative z-10 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                      <Image
                        src={t.image}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                        {t.name}{" "}
                        {t.verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {t.role}
                      </div>
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
                  className={`relative bg-white dark:bg-slate-900 p-10 rounded-[2rem] border ${plan.popular ? "border-blue-600 dark:border-blue-500 shadow-[0_20px_60px_rgba(37,99,235,0.15)] scale-105 z-10 ring-4 ring-blue-50 dark:ring-blue-900/20" : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg"} transition-all duration-300 flex flex-col`}
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
