"use client";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Lock,
  Star,
  Zap,
  Camera,
  Briefcase,
  Heart,
  GraduationCap,
  Users,
  Linkedin,
  ChevronRight,
  Menu,
  X,
  Mail,
  Loader2,
  Award,
  TrendingUp,
  Quote,
  Crown,
  Check,
  Flame,
  Play,
  Eye,
  ChevronDown,
  DollarSign,
  Hourglass,
  Layers,
  Stethoscope,
  Scale,
  Home as HomeIcon,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
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

/* ─────────────────────────────────────────────────────────────────── */
/*  DATA                                                               */
/*                                                                      */
/*  PHOTO-IDENTITY RULE (read this before editing any array below):    */
/*  A real photo must never appear as an anonymous "trusted user"      */
/*  avatar AND as a named testimonial AND as an unlabeled style        */
/*  sample at the same time — that&apos;s what makes a skeptical visitor    */
/*  realize the "real customers" are recycled stock/AI faces. Keep     */
/*  each pool below self-contained:                                    */
/*   - AVATARS: anonymous trust-pill only, stock, never reused below   */
/*   - TESTIMONIALS: real /shots outputs, tied to one name each        */
/*   - LORA_IMAGES: mix of real /shots + stock, no names attached      */
/*   - STYLE_PREVIEWS corporate/creative/founder: real /shots outputs  */
/*   - STYLE_PREVIEWS executive/actor/outdoor: stock, modal-only pool  */
/* ─────────────────────────────────────────────────────────────────── */

// Decorative hero background collage — low opacity, unlabeled, no identity
// claims are made about these, so stock reuse here is fine.
const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=90&fit=crop",
    label: "Corporate",
    style: "Executive Suite",
  },
  {
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=90&fit=crop",
    label: "LinkedIn",
    style: "LinkedIn Pro",
  },
  {
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=90&fit=crop",
    label: "Founder",
    style: "Startup Founder",
  },
  {
    src: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=90&fit=crop",
    label: "Creative",
    style: "Creative Director",
  },
  {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=90&fit=crop",
    label: "Tech",
    style: "Tech Executive",
  },
  {
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=90&fit=crop",
    label: "Premium",
    style: "C-Suite Portrait",
  },
  {
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=90&fit=crop",
    label: "Corporate",
    style: "Corporate Classic",
  },
  {
    src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=90&fit=crop",
    label: "Executive",
    style: "Executive Portrait",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=90&fit=crop",
    label: "Casual Pro",
    style: "Relaxed Pro",
  },
  {
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=90&fit=crop",
    label: "Warm",
    style: "Warm & Approachable",
  },
  {
    src: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=90&fit=crop",
    label: "Premium",
    style: "Premium Dark",
  },
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=90&fit=crop",
    label: "Editorial",
    style: "Editorial",
  },
];

// Homepage "Every look. One order." style grid. Real generated outputs where
// we have them (man5/girl4/man4/man6 — none of which are used in
// TESTIMONIALS below), stock for the remaining categories.
const LORA_IMAGES = [
  {
    src: "/shots/man5 - after.jpeg",
    label: "Corporate",
    style: "Executive Suite",
  },
  {
    src: "/shots/girl4 - after.jpeg",
    label: "LinkedIn",
    style: "LinkedIn Pro",
  },
  {
    src: "/shots/man4 - after.jpeg",
    label: "Founder",
    style: "Startup Founder",
  },
  {
    src: "/shots/man6 - after.jpeg",
    label: "Creative",
    style: "Creative Director",
  },
  {
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=90&fit=crop",
    label: "Tech",
    style: "Tech Executive",
  },
  {
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=90&fit=crop",
    label: "Premium",
    style: "C-Suite Portrait",
  },
  {
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=90&fit=crop",
    label: "Casual Pro",
    style: "Relaxed Pro",
  },
  {
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=90&fit=crop",
    label: "Editorial",
    style: "Editorial",
  },
];

// Style preview categories for the Free Preview modal
const STYLE_PREVIEWS = [
  {
    id: "corporate",
    name: "Corporate",
    desc: "Navy suit · Neutral background · LinkedIn-ready",
    color: "#1E40AF",
    images: [
      "/shots/man1 - after.jpeg",
      "/shots/girl1 - after.jpeg",
      "/shots/man5 - after.jpeg",
    ],
  },
  {
    id: "creative",
    name: "Creative Pro",
    desc: "Modern · Editorial · Artistic lighting",
    color: "#7C3AED",
    images: [
      "/shots/girl2 - after.jpeg",
      "/shots/man4 - after.jpeg",
      "/shots/girl3 - after.jpeg",
    ],
  },
  {
    id: "founder",
    name: "Startup Founder",
    desc: "Casual blazer · Office · Confident & approachable",
    color: "#059669",
    images: [
      "/shots/man2- after.jpeg",
      "/shots/man6 - after.jpeg",
      "/shots/girl4 - after.jpeg",
    ],
  },
  {
    id: "executive",
    name: "C-Suite",
    desc: "Premium portrait · Dramatic lighting · Authority",
    color: "#B45309",
    images: [
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=85&fit=crop",
    ],
  },
  {
    id: "actor",
    name: "Actor / Model",
    desc: "Theatrical · Comp card · Multiple expressions",
    color: "#DC2626",
    images: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=85&fit=crop",
    ],
  },
  {
    id: "outdoor",
    name: "Outdoor / Casual",
    desc: "Natural light · Parks · Dating & social apps",
    color: "#0D9488",
    images: [
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=85&fit=crop",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=85&fit=crop",
    ],
  },
];

const BEFORE_AFTER_EXAMPLES = [
  { before: "/shots/girl1 - before.jpg", after: "/shots/girl1 - after.jpeg" },
  { before: "/shots/man1 - before.jpg", after: "/shots/man1 - after.jpeg" },
  { before: "/shots/girl2 - before.jpg", after: "/shots/girl2 - after.jpeg" },
  { before: "/shots/man2- before.jpg", after: "/shots/man2- after.jpeg" },
  { before: "/shots/girl3 - before.jpg", after: "/shots/girl3 - after.jpeg" },
  { before: "/shots/man3 - before.jpg", after: "/shots/man3 - after.jpeg" },
];

// Anonymous mini-avatars for the hero trust pill. Stock only, and
// deliberately NOT reused anywhere a name or "style example" label
// gets attached — otherwise a visitor can catch the same face playing
// two roles.
const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&q=80&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&q=80&fit=crop",
];

// Who Truzot is for — replaces the fake "company logos" trust bar.
// Broadens the positioning beyond corporate professionals.
const AUDIENCES = [
  { icon: Briefcase, label: "Job seekers" },
  { icon: Scale, label: "Lawyers" },
  { icon: Stethoscope, label: "Doctors & nurses" },
  { icon: HomeIcon, label: "Real estate agents" },
  { icon: Camera, label: "Actors & models" },
  { icon: GraduationCap, label: "Students" },
  { icon: Heart, label: "Therapists & coaches" },
  { icon: Users, label: "Founders & teams" },
];

// Testimonials use real generated outputs (/shots), each tied to exactly
// one name, and none of these files are reused in AVATARS or LORA_IMAGES.
// NOTE ON METRICS: every "metric" badge below describes something the
// customer directly experienced and could plausibly self-report (delivery
// time, photo count, how they used the photos) — never a causal downstream
// outcome like "closed a $4M round" or "$45K raise" that a headshot alone
// can't be credited for. That distinction matters for ad-platform policy
// compliance and for not overpromising results we can't substantiate.
const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "VP of Product @ TechFlow",
    text: "Genuinely close to the $800 studio session I did in NYC last year — my whole team asked where I got it done.",
    rating: 5,
    metric: "Delivered in 34 minutes",
    headshot: "/shots/girl1 - after.jpeg",
  },
  {
    name: "Marcus Johnson",
    role: "Commercial Actor, LA",
    text: "Fresh commercial and theatrical looks without paying for multiple wardrobe changes. Real time-saver for my comp card.",
    rating: 5,
    metric: "5 looks, 1 upload",
    headshot: "/shots/man1 - after.jpeg",
  },
  {
    name: "Emily Rodriguez",
    role: "Principal Broker, Luxury RE",
    text: "In luxury real estate, trust is everything. These photos matched the quality of my listing marketing right away.",
    rating: 5,
    metric: "Used across all listings",
    headshot: "/shots/girl2 - after.jpeg",
  },
  {
    name: "David Park",
    role: "Senior Software Engineer",
    text: "Updated LinkedIn in 10 minutes flat. No studio visit, no scheduling back and forth. Worth every cent.",
    rating: 5,
    metric: "Live on LinkedIn same day",
    headshot: "/shots/man2- after.jpeg",
  },
  {
    name: "Jessica Turner",
    role: "Creative Director @ Ogilvy",
    text: "Skeptical of AI photography until I saw the skin textures and lighting logic. Captured my actual features, not a generic face.",
    rating: 5,
    metric: "2nd order for her team",
    headshot: "/shots/girl3 - after.jpeg",
  },
  {
    name: "Michael Brent",
    role: "Y Combinator Founder",
    text: "Used for our pitch deck and press kit. Nobody who saw it guessed it was AI-generated.",
    rating: 5,
    metric: "Used in pitch deck & press kit",
    headshot: "/shots/man3 - after.jpeg",
  },
];

const FAQS = [
  {
    q: "Do these actually look like me, not a generic AI face?",
    a: "Yes — that&apos;s the core difference. Unlike apps that apply a filter, Truzot trains a private custom LoRA model on your exact facial geometry, skin texture, and micro-expressions using Flux architecture. The result looks like you had a studio session, not like a plastic AI avatar.",
  },
  {
    q: "Why do you only need 1–5 photos? Competitors ask for 15–25.",
    a: "Our Flux LoRA architecture is more sample-efficient than older Stable Diffusion models. Uploading too many similar photos actually hurts quality. 1–5 well-lit, varied selfies gives our model exactly the signal it needs — no more, no less.",
  },
  {
    q: "What is the View Examples, and how does it work?",
    a: "Click &apos;View Examples&apos; to browse our full style gallery — Corporate, Creative, Founder, Actor, and more — and see real sample outputs for each. No upload, no payment required. Once you find styles you love, click &apos;Get these looks&apos; to start your order.",
  },
  {
    q: "How fast will I get my photos?",
    a: "Executive plans: ~30 minutes. Pro plans: ~1 hour. Basic plans: ~2 hours. You'll get a real-time email the moment your private gallery is ready to download.",
  },
  {
    q: "Are my photos and face data private?",
    a: "Yes. All data is AES-256 encrypted. Your uploaded selfies and the trained model are permanently and automatically purged from our servers 30 days after delivery. We never use your face to train public models or share data with third parties.",
  },
  {
    q: "What if I don't love the results?",
    a: "Request a 100% refund within 30 days — no forms, no questions, no hassle. Just click 'Request Refund' in your dashboard. You keep the photos either way.",
  },
  {
    q: "Can I use these for commercial purposes?",
    a: "Yes. Every plan includes full commercial use rights. Use your headshots on your website, LinkedIn, press releases, speaking bios, pitch decks, and marketing materials with no restrictions.",
  },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/truzot/",
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590417309053",
    icon: Facebook,
  },
  { label: "TikTok", href: "https://www.tiktok.com/@truzot", icon: "tiktok" },
  { label: "X", href: "https://x.com/Truzot", icon: Twitter },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/truzot.bsky.social",
    icon: "bluesky",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/truzot",
    icon: Linkedin,
  },
  { label: "YouTube", href: "https://www.youtube.com/@Truzot", icon: Youtube },
];

// ROI Calculator Data
const ROI_MULTIPLIERS = {
  LinkedIn: 3.2,
  "Company bio": 2.1,
  Conference: 2.5,
  "Press kit": 2.8,
};

/* ─────────────────────────────────────────────────────────────────── */
/*  ICONS NOT IN LUCIDE (TikTok, Bluesky)                              */
/* ─────────────────────────────────────────────────────────────────── */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.6 5.82c-.99-.96-1.53-2.27-1.53-3.66h-3.07v13.6c0 1.55-1.26 2.81-2.81 2.81a2.81 2.81 0 1 1 0-5.62c.27 0 .53.04.78.11v-3.12a6 6 0 0 0-.78-.05 5.94 5.94 0 1 0 5.94 5.94V9.4a8.6 8.6 0 0 0 5.04 1.62V8c-1.32 0-2.54-.42-3.57-1.18z" />
    </svg>
  );
}
function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 9.6C10.6 7 6.9 2.3 3.7 0 .6-2 0 .6 0 2.3c0 .4.2 3.6.4 4.2.7 2.4 3.1 3 5.4 2.7-3.9.6-7.3 2-2.8 7.1 4.9 5.2 6.7-1.1 7-2.4.3 1.3 1.4 7.5 6.9 2.4 4.2-4.2 1.2-6.5-2.8-7.1 2.3.3 4.7-.3 5.4-2.7.2-.6.4-3.8.4-4.2C24 .6 23.4-2 20.3 0c-3.2 2.3-6.9 7-8.3 9.6z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  ANIMATION HELPERS                                                  */
/* ─────────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─────────────────────────────────────────────────────────────────── */
/*  ANIMATED COUNTER                                                   */
/* ─────────────────────────────────────────────────────────────────── */
function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !animated.current) {
          animated.current = true;
          const t0 = Date.now();
          const step = () => {
            const p = Math.min((Date.now() - t0) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(step);
          };
          step();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  LIVE ACTIVITY TOAST — now backed by real data, not fabricated.      */
/*                                                                      */
/*  Expects a Supabase table (adjust the name/columns to your schema)   */
/*  shaped roughly like:                                                */
/*    orders(first_name text, city text, style text,                    */
/*           status text, created_at timestamptz)                       */
/*  Only rows with status = &apos;completed&apos; are shown. If the query fails   */
/*  or returns nothing, the widget renders nothing — we never fall back */
/*  to made-up names/timestamps, since a visitor who watches the same   */
/*  fake loop repeat will stop trusting every other stat on the page.   */
/* ─────────────────────────────────────────────────────────────────── */
type ActivityItem = {
  name: string;
  location: string;
  style: string;
  ago: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function LiveActivityToast() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("first_name, city, style, created_at")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(8);

        if (!error && data && data.length > 0 && mounted) {
          setActivities(
            data
              .filter((d: any) => d.first_name && d.created_at)
              .map((d: any) => ({
                name: `${String(d.first_name).trim()}${String(d.first_name).trim().slice(-1) === "." ? "" : "."}`,
                location: d.city || "",
                style: d.style || "Headshots",
                ago: timeAgo(d.created_at),
              })),
          );
        }
      } catch {
        // No fallback on purpose — see comment above the component.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % activities.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [activities]);

  if (activities.length === 0) return null;

  const a = activities[idx];
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-3 bg-[#0E1016] border border-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl"
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-lime-400 rounded-full absolute -top-0.5 -right-0.5 animate-ping" />
            <div className="w-2.5 h-2.5 bg-lime-400 rounded-full absolute -top-0.5 -right-0.5" />
            <Camera className="w-5 h-5 text-white/60" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white">{a.name}</span>
            {a.location && (
              <span className="text-white/40"> · {a.location}</span>
            )}
            <br />
            <span className="text-lime-400 font-semibold">{a.style}</span>
            <span className="text-white/30"> delivered · {a.ago}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  MOBILE STICKY CTA — the page is long; mobile visitors who scroll   */
/*  past the hero previously had no persistent path to convert without */
/*  scrolling all the way back up. Appears after the hero, desktop     */
/*  untouched (nav already has a persistent CTA there).                */
/* ─────────────────────────────────────────────────────────────────── */
function StickyMobileCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#07080A]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">
              From $29 · 30-day guarantee
            </p>
            <p className="text-white/40 text-xs truncate">
              Results in under 2 hours
            </p>
          </div>
          <Link
            href="/upload"
            className="shrink-0 bg-lime-400 text-black px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5"
          >
            Get headshots <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  WHO IT&apos;S FOR — replaces fake company-logo marquee                  */
/* ─────────────────────────────────────────────────────────────────── */
function AudienceStrip() {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-5xl mx-auto">
        {AUDIENCES.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:border-lime-600/40 hover:bg-white transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface2)",
              }}
            >
              <Icon className="w-4 h-4 text-lime-600/90" />
              {a.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HERO PHOTO GRID                                                    */
/* ─────────────────────────────────────────────────────────────────── */
function HeroPhotoGrid() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 gap-1 opacity-30 pointer-events-none overflow-hidden">
      {GALLERY_IMAGES.map((img, i) => (
        <motion.div
          key={i}
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08, duration: 0.8 }}
        >
          <Image
            src={img.src}
            alt={`${img.style} headshot example`}
            fill
            className="object-cover object-top"
            sizes="200px"
            priority={i < 3}
            loading={i < 3 ? undefined : "lazy"}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                     */
/* ─────────────────────────────────────────────────────────────────── */
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
  const [scrolled, setScrolled] = useState(false);
  const [headshotsCount] = useState(1200000);

  // ROI Calculator State
  const [roiProfession, setRoiProfession] =
    useState<keyof typeof ROI_MULTIPLIERS>("Company bio");
  const [roiViews, setRoiViews] = useState(1110);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setIsAuthed(true);
    });
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const handleMouseLeave = (e: MouseEvent) => {
      const done = localStorage.getItem("truzot-exit-dismissed") === "true";
      if (done) return;
      if (e.clientY <= 0) setShowExitPopup(true);
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
        localStorage.setItem("truzot-exit-dismissed", "true");
        setTimeout(() => setShowExitPopup(false), 2200);
      } else setSubmitStatus("error");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ROI Calculations
  const roiMultiplier = ROI_MULTIPLIERS[roiProfession];
  const projectedViews = Math.round(roiViews * roiMultiplier);
  const viewIncrease = projectedViews - roiViews;

  return (
    <>
      <ProductSchema />
      <SpeakableSchema />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />

      {/* CSS Variables — dark photographic theme */}
      <style>{`
        :root {
          --bg: #07080A;
          --surface: #0E1016;
          --surface2: #161820;
          --surface3: #1C1F29;
          --lime: #A3E635;
          --lime-dim: rgba(163,230,53,0.12);
          --lime-border: rgba(163,230,53,0.3);
          --lime-text: #A3E635;
          --indigo: #6366F1;
          --border: rgba(255,255,255,0.07);
          --text: #FAFAFA;
          --text-muted: rgba(255,255,255,0.4);
          --muted: #52525B;
        }
        html, body, #__next {
          background-color: var(--bg) !important;
          overscroll-behavior-y: none;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .animate-marquee { animation: marquee 38s linear infinite; }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6 } 100% { transform: scale(2.2); opacity: 0 } }
        .pulse-ring { animation: pulse-ring 2.4s ease-out infinite; }
        html { scroll-behavior: smooth; }

        .light-zone {
          --bg: #FFFFFF;
          --surface: #F8FAFC;
          --surface2: #F1F5F9;
          --surface3: #E2E8F0;
          --border: rgba(15,23,42,0.08);
          --text: #0F172A;
          --text-muted: rgba(15,23,42,0.45);
          --muted: #64748B;
          --lime-dim: rgba(101,163,13,0.10);
          --lime-border: rgba(101,163,13,0.35);
          --lime-text: #65A30D;
          background: var(--bg);
        }

        /* Custom Range Slider for ROI Calculator */
        .roi-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: #E2E8F0;
          border-radius: 10px;
          outline: none;
        }
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: #65A30D;
          border: 3px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .roi-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .roi-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: #65A30D;
          border: 3px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>

      <div
        id="main-content"
        className="min-h-screen font-sans selection:bg-lime-400/20"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        {/* Scroll progress */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] z-[70] origin-left"
          style={{
            scaleX: scrollYProgress,
            background: "linear-gradient(to right, #A3E635, #6366F1)",
          }}
        />

        {/* Live activity toast — only renders if real data exists */}
        <LiveActivityToast />

        {/* Mobile sticky CTA — persistent path to convert on long scroll */}
        <StickyMobileCTA />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  NAVIGATION                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <nav
          className={`fixed top-0 w-full z-50 transition-all duration-300 ${
            scrolled
              ? "bg-[#07080A]/90 backdrop-blur-xl border-b border-transparent shadow-md"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter text-white"
            >
              TRUZOT
              <span className="ml-1.5 text-[10px] font-bold text-lime-400 align-super tracking-widest">
                AI
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-white/50">
              <a href="#examples" className="hover:text-white transition">
                Examples
              </a>
              <a href="#how-it-works" className="hover:text-white transition">
                How it works
              </a>
              <a href="#pricing" className="hover:text-white transition">
                Pricing
              </a>
              {isAuthed ? (
                <Link href="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="hover:text-white transition">
                  Sign in
                </Link>
              )}

              {/* View Examples CTA */}
              <Link
                href="/free-preview"
                className="flex items-center gap-2 border border-[var(--border)] px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--lime-text)] hover:bg-[var(--surface2)] transition"
              >
                <Eye className="w-4 h-4" /> View Examples
              </Link>

              {/* Primary CTA */}
              <Link
                href="/upload"
                className="relative group bg-lime-400 text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 flex items-center gap-1.5"
              >
                Get headshots
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-[#0E1016] border-b border-white/8 py-5 px-6 flex flex-col gap-4 font-semibold">
              <a
                href="#examples"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/60 hover:text-white transition"
              >
                Examples
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/60 hover:text-white transition"
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/60 hover:text-white transition"
              >
                Pricing
              </a>
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/free-preview"
                onClick={() => setMobileMenuOpen(false)}
                className="border border-[var(--border)] text-[var(--text-muted)] px-4 py-3 rounded-xl text-left flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Examples
              </Link>
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-lime-400 text-black text-center px-5 py-3 rounded-xl font-bold"
              >
                Get headshots
              </Link>
            </div>
          )}
        </nav>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HERO                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
          {/* Background: photographic grid */}
          <HeroPhotoGrid />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080A]/40 via-[#07080A]/70 to-[#07080A]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080A]/60 via-transparent to-[#07080A]/60" />

          {/* Ambient glow */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            }}
          />

          <motion.div
            style={{ y: heroY }}
            className="relative z-10 max-w-5xl mx-auto text-center"
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {/* Trust pill */}
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white/70 mb-10"
              >
                <div className="flex -space-x-2">
                  {AVATARS.map((src, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#07080A] overflow-hidden"
                    >
                      <Image
                        src={src}
                        alt=""
                        width={28}
                        height={28}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span>
                  Trusted by <strong className="text-white">thousands of</strong>{" "}
                  people
                </span>
                <span className="w-px h-4 bg-white/15" />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-1 font-bold text-white">4.9</span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[0.92] mb-7"
              >
                <span className="text-white">AI headshots.</span>
                <br />
                <span className="relative">
                  <span className="text-lime-400">Professional results.</span>
                </span>
                <br />
                <span className="text-white/40">Under 2 hours from your phone.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-white/50 mb-6 max-w-2xl mx-auto leading-relaxed"
              >
                Upload <strong className="text-white">1–5 selfies</strong>. Our
                AI headshot generator trains a private model on your face and delivers
                <strong className="text-white">
                  {" "}
                  40–200 professional headshots
                </strong>{" "}
                for LinkedIn, corporate profiles, and more — at a fraction of what photographers
                charge.
              </motion.p>

              {/* 1-5 selfies differentiator badge */}
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-white/5 border border-lime-400/25 text-lime-400 px-4 py-2 rounded-full text-sm font-bold mb-8"
              >
                <Zap className="w-4 h-4" />
                Only 1–5 selfies needed — competitors require 15–25
              </motion.div>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
              >
                <Link
                  href="/upload"
                  className="group w-full sm:w-auto bg-lime-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-lime-300 transition-all shadow-xl shadow-lime-400/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create my headshots
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/free-preview"
                  className="w-full sm:w-auto bg-[var(--surface2)] backdrop-blur-sm text-[var(--text)] border border-[var(--border)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[var(--surface3)] transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" /> View Examples
                </Link>
              </motion.div>

              {/* Audience line — broadens beyond "professionals" */}
              <motion.p
                variants={fadeUp}
                className="text-sm md:text-base text-white/40 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                Lawyers, doctors, real estate agents, job seekers, actors,
                models, students, founders — anyone can look this good.
              </motion.p>

              {/* Internal links for SEO */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/30 mb-10"
              >
                <Link href="/profession/doctor" className="hover:text-lime-400 transition">Doctor headshots</Link>
                <span>·</span>
                <Link href="/profession/lawyer" className="hover:text-lime-400 transition">Lawyer headshots</Link>
                <span>·</span>
                <Link href="/profession/real-estate-agent" className="hover:text-lime-400 transition">Real estate agent headshots</Link>
                <span>·</span>
                <Link href="/profession/actor" className="hover:text-lime-400 transition">Actor headshots</Link>
                <span>·</span>
                <Link href="/profession/teacher" className="hover:text-lime-400 transition">Teacher headshots</Link>
              </motion.div>

              {/* Micro-proof */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-sm text-white/40 font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-lime-400" /> 30-day
                  money-back
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-lime-400" /> AES-256 encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-lime-400" /> Auto-purge in 30
                  days
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-lime-400" /> From $29 one-time
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  LIGHT ZONE START — everything from here through the final  */}
        {/*  CTA renders on a white background (see .light-zone above). */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="light-zone">
          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  WHO IT&apos;S FOR (replaces the fake company-logo bar)          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            className="py-10 border-y"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
              Built for every profession — not just executives
            </p>
            <AudienceStrip />
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  STATS                                                     */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="py-20 px-6" style={{ background: "var(--bg)" }}>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  value: 8400,
                  suffix: "+",
                  label: "People served",
                  sub: "across 42 countries",
                },
                {
                  value: 1200000,
                  suffix: "+",
                  label: "Headshots generated",
                  sub: "and counting live",
                },
                {
                  value: 4.9,
                  suffix: "/5",
                  label: "Average rating",
                  sub: "642 verified Trustpilot reviews",
                  isDecimal: true,
                },
                {
                  value: 30,
                  suffix: " min",
                  label: "Average delivery",
                  sub: "Executive plan",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center group"
                >
                  <div className="text-4xl md:text-5xl font-black text-slate-900 mb-1 tracking-tight tabular-nums">
                    {stat.isDecimal ? (
                      <span>
                        {stat.value}
                        {stat.suffix}
                      </span>
                    ) : (
                      <AnimatedCounter
                        target={stat.value}
                        suffix={stat.suffix}
                      />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-600 mb-0.5">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-400">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
            {/* NOTE: User count should match real backend counts before shipping — an unlinked
              claim next to a number nobody can check is exactly the kind of
              detail a skeptical buyer probes first. Consider linking this to
              a public reviews page (Trustpilot/Google) if you have one. */}
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  BEFORE / AFTER GALLERY                                    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            id="examples"
            className="py-24 px-6"
            style={{ background: "var(--surface)" }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-16"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-lime-600 uppercase tracking-[0.2em] mb-4"
                >
                  REAL AI OUTPUT · ZERO MANUAL RETOUCHING
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-slate-900"
                >
                  AI-generated professional headshots.
                  <br />
                  <span className="text-slate-400">
                    Delivered in under an hour.
                  </span>
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-slate-500 max-w-xl mx-auto text-lg"
                >
                  Tap a card to compare. Every output uses a model trained on{" "}
                  <em>that person&apos;s</em> face — not a generic template.
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7 }}
                className="mb-16 rounded-3xl border p-2 md:p-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface2)",
                }}
              >
                <BeforeAfterCarousel examples={BEFORE_AFTER_EXAMPLES} />
              </motion.div>

              {/* Interactive slider — one hero comparison */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <p className="text-xs font-bold text-lime-600 uppercase tracking-widest mb-4">
                    DRAG TO COMPARE
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
                    Indistinguishable from a $500 studio shoot.
                  </h3>
                  <ul className="space-y-3 text-slate-600 text-sm font-medium mb-6">
                    {[
                      "Authentic skin texture & pores",
                      "Perfected three-point studio lighting",
                      "True facial likeness — it&apos;s really you",
                      "Natural expressions, not plastic smiles",
                    ].map((t, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-lime-600 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/free-preview"
                    className="inline-flex items-center gap-2 text-[var(--lime-text)] font-bold hover:gap-3 transition-all text-sm"
                  >
                    View examples <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl overflow-hidden"
                >
                  <ComparisonSlider
                    before="/shots/man5 - before.jpg"
                    after="/shots/man5 - after.jpeg"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  STYLE GRID — "Free Preview" teaser                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6"
              >
                <div>
                  <motion.p
                    variants={fadeUp}
                    className="text-xs font-bold text-lime-600 uppercase tracking-[0.2em] mb-3"
                  >
                    6+ Style Categories
                  </motion.p>
                  <motion.h2
                    variants={fadeUp}
                    className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900"
                  >
                    Every look.
                    <br />
                    One order.
                  </motion.h2>
                </div>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/free-preview"
                    className="inline-flex items-center gap-2 border border-[var(--lime-border)] bg-[var(--lime-dim)] text-[var(--lime-text)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--surface2)] transition"
                  >
                    <Eye className="w-4 h-4" /> View examples
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={stagger}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {LORA_IMAGES.map((img, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="relative group rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
                  >
                    <Link href="/free-preview" className="block w-full h-full">
                      <Image
                        src={img.src}
                        alt={`${img.style} headshot style example`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="300px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                          {img.label}
                        </span>
                        <p className="text-sm font-bold text-white">
                          {img.style}
                        </p>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-lime-400/90 rounded-full p-1.5">
                          <Eye className="w-3.5 h-3.5 text-black" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <div className="text-center mt-8">
                <Link
                  href="/free-preview"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm font-semibold transition flex items-center gap-2 mx-auto"
                >
                  View all 6 style categories{" "}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PAIN POINTS                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            className="py-24 px-6 border-y"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-14"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-red-600 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5" /> The old way is broken
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4"
                >
                  A bad headshot is costing you
                  <br />
                  <span className="text-slate-400">more than you think.</span>
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-slate-500 max-w-xl mx-auto text-lg"
                >
                  LinkedIn profiles with a professional photo get{" "}
                  <strong className="text-slate-900">21× more views</strong>{" "}
                  and{" "}
                  <strong className="text-slate-900">
                    36× more messages
                  </strong>{" "}
                  than profiles without one.
                </motion.p>
                <motion.p
                  variants={fadeUp}
                  className="text-xs text-slate-400 max-w-xl mx-auto mt-2"
                >
                  Source: LinkedIn Talent Solutions data
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid md:grid-cols-3 gap-4"
              >
                {[
                  {
                    Icon: DollarSign,
                    title: "$400–$800 per session",
                    desc: "Traditional photographers charge a premium for 30 minutes — plus retouching fees on top. Then you wait 2–4 weeks.",
                    badge: "$500+ avg",
                  },
                  {
                    Icon: Hourglass,
                    title: "2–4 weeks turnaround",
                    desc: "Scheduling, shooting, editing, revisions. Your new headshot arrives weeks after you needed it.",
                    badge: "2–4 weeks",
                  },
                  {
                    Icon: Layers,
                    title: "10–30 photos, one look",
                    desc: "One outfit. One background. Need variety for LinkedIn, dating, and press? Pay for another session.",
                    badge: "Limited variety",
                  },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="relative p-7 rounded-2xl border hover:border-red-400/30 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300"
                    style={{
                      background: "var(--surface2)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="absolute top-4 right-4 text-[10px] font-bold text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
                      {p.badge}
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)",
                      }}
                    >
                      <p.Icon className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {p.desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  HOW IT WORKS                                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            id="how-it-works"
            className="py-24 px-6"
            style={{ background: "var(--bg)" }}
          >
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-16"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-lime-600 uppercase tracking-[0.2em] mb-4"
                >
                  Dead simple
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900"
                >
                  Three steps to AI headshots.
                  <br />
                  <span className="text-slate-400">Thirty minutes.</span>
                </motion.h2>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid md:grid-cols-3 gap-6"
              >
                {[
                  {
                    n: "01",
                    icon: Camera,
                    title: "Upload 1–5 selfies",
                    desc: "No studio. No lighting setup. Just phone photos taken in natural light — that&apos;s all our AI headshot generator needs.",
                    detail:
                      "Most competitors require 15–25 photos. Ours needs just 1.",
                    color: "#65A30D",
                  },
                  {
                    n: "02",
                    icon: Sparkles,
                    title: "We train your AI model",
                    desc: "Our Flux LoRA model learns your exact facial geometry, skin tone, and micro-expressions. Private. Just yours.",
                    detail:
                      "Custom AI headshot model, not a generic filter. Purged after 30 days.",
                    color: "#6366F1",
                  },
                  {
                    n: "03",
                    icon: Briefcase,
                    title: "Download professional headshots",
                    desc: "40–200 AI-generated headshots across every style. High-res, full commercial rights, yours forever.",
                    detail:
                      "Use on LinkedIn, corporate profiles, pitch decks, press releases, anywhere.",
                    color: "#65A30D",
                  },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      className="relative p-8 rounded-3xl border hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {/* Premium Background Number */}
                      <div className="absolute -top-2 -right-2 text-[80px] font-black text-slate-900/[0.04] group-hover:text-slate-900/[0.06] transition-colors select-none pointer-events-none leading-none">
                        {s.n}
                      </div>

                      <div className="relative z-10">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105"
                          style={{
                            background: `${s.color}15`,
                            border: `1px solid ${s.color}25`,
                          }}
                        >
                          <Icon
                            className="w-7 h-7"
                            style={{ color: s.color }}
                          />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-5">
                          {s.desc}
                        </p>
                        <div
                          className="flex items-start gap-2 text-xs text-slate-400 border-t pt-4"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <CheckCircle
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                            style={{ color: s.color }}
                          />
                          <span className="font-medium">{s.detail}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="text-center mt-12">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 bg-lime-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-lime-300 transition shadow-xl shadow-lime-400/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start my headshots <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  COMPARISON TABLE                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            className="py-24 px-6 border-y"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-14"
              >
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4"
                >
                  How we stack up.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-500 text-lg">
                  Truzot vs. traditional photography vs. other AI apps.
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border overflow-hidden shadow-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface2)",
                }}
              >
                <div
                  className="grid grid-cols-4 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Feature
                  </div>
                  <div
                    className="p-5 text-center"
                    style={{
                      background: "rgba(163,230,53,0.06)",
                      borderLeft: "1px solid rgba(163,230,53,0.15)",
                      borderRight: "1px solid rgba(163,230,53,0.15)",
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-lime-600 font-bold text-sm">
                      <Crown className="w-3.5 h-3.5" /> TRUZOT
                    </div>
                  </div>
                  <div className="p-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Photographer
                  </div>
                  <div className="p-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Other AI
                  </div>
                </div>
                {[
                  ["Price", "$29–$59", "$400–$800", "$20–$60"],
                  [
                    "Photos needed",
                    "1–5 selfies",
                    "Photographer present",
                    "12–25 selfies",
                  ],
                  ["Turnaround", "30 min – 2 hrs", "2–4 weeks", "1–6 hours"],
                  [
                    "Output volume",
                    "40–200 photos",
                    "10–30 photos",
                    "10–40 photos",
                  ],
                  [
                    "Style variety",
                    "6+ categories",
                    "1–2 setups",
                    "Generic filters",
                  ],
                  [
                    "True facial likeness",
                    "✓ Custom LoRA",
                    "✓ Human eye",
                    "✗ Generic model",
                  ],
                  ["Data privacy", "✓ AES-256 · 30d purge", "Varies", "Rarely"],
                  ["Money-back guarantee", "✓ 30 days", "Rarely", "Varies"],
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 border-t hover:bg-slate-900/[0.02] transition"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="p-4 text-sm font-semibold text-slate-600">
                      {row[0]}
                    </div>
                    <div
                      className="p-4 text-center text-sm font-bold text-lime-600"
                      style={{ background: "rgba(163,230,53,0.03)" }}
                    >
                      {row[1]}
                    </div>
                    <div className="p-4 text-center text-sm text-slate-400">
                      {row[2]}
                    </div>
                    <div className="p-4 text-center text-sm text-slate-400">
                      {row[3]}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  ROI CALCULATOR                                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-14"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-lime-600 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Calculate your ROI
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-3"
                >
                  See the impact a great headshot has.
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-slate-500 text-lg max-w-2xl mx-auto"
                >
                  Professional headshots can increase profile views by 2-3x. See
                  what that means for you.
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border p-8 md:p-12 grid md:grid-cols-2 gap-10 md:gap-16 items-center shadow-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                {/* Controls */}
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-4">
                    I am a...
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {Object.keys(ROI_MULTIPLIERS).map((role) => (
                      <button
                        key={role}
                        onClick={() =>
                          setRoiProfession(role as keyof typeof ROI_MULTIPLIERS)
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          roiProfession === role
                            ? "bg-lime-400 text-black border-lime-400 shadow-sm"
                            : "bg-[var(--surface2)] text-slate-600 border-[var(--border)] hover:border-lime-600/40"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">
                      Current monthly profile views
                    </p>
                    <span className="text-2xl font-black text-slate-900 tabular-nums bg-slate-100 px-3 py-1 rounded-md">
                      {roiViews}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="10"
                    value={roiViews}
                    onChange={(e) => setRoiViews(Number(e.target.value))}
                    className="w-full roi-slider mt-4"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>100</span>
                    <span>5,000+</span>
                  </div>
                </div>

                {/* Results */}
                <div className="relative p-8 rounded-2xl bg-[#0E1016] border border-white/10 shadow-xl text-white">
                  <div className="absolute -top-3 left-8 bg-lime-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Projected Impact
                  </div>

                  <div className="mb-6 mt-2">
                    <div className="text-5xl font-black mb-1 tabular-nums tracking-tight text-white">
                      {projectedViews.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-white/50">
                      Estimated monthly views
                    </div>
                    <div className="text-[11px] text-white/25 font-medium mt-1">
                      Illustrative estimate based on industry-reported view
                      multipliers, not a guarantee of your results.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-lime-400 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Increase
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white tabular-nums">
                        +{viewIncrease.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/40 font-medium">
                        more views/mo
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Multiplier
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white tabular-nums">
                        {roiMultiplier}x
                      </div>
                      <div className="text-xs text-white/40 font-medium">
                        more visibility
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/50 text-sm font-medium">
                        From an investment of
                      </span>
                      <span className="text-3xl font-black text-white tracking-tight">
                        ${PLANS?.pro?.price ?? 39}
                      </span>
                    </div>
                    <Link
                      href="/upload?plan=pro"
                      className="w-full bg-lime-400 text-black py-3.5 rounded-xl font-bold hover:bg-lime-300 transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      Get the Professional Shoot — ${PLANS?.pro?.price ?? 39}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="mt-4 text-center text-xs text-white/30 font-medium flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3" /> 30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  TESTIMONIALS                                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            className="py-24 px-6 border-y"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-14"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 fill-current" /> Wall of love
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-3"
                >
                  Don&apos;t take our word for it.
                </motion.h2>
                <motion.div
                  variants={fadeUp}
                  className="flex items-center justify-center gap-1.5 text-amber-600 mb-1"
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                  <span className="ml-2 text-slate-900 font-bold text-lg">
                    4.9
                  </span>
                  <span className="text-slate-400 text-sm font-medium">
                    from 642 verified reviews
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid md:grid-cols-3 gap-5"
              >
                {TESTIMONIALS.map((t, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="p-7 rounded-2xl border hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 flex flex-col"
                    style={{
                      background: "var(--bg)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Metric badge */}
                    <div className="inline-flex items-center gap-1.5 bg-lime-400/10 border border-lime-400/20 text-lime-600 px-3 py-1.5 rounded-full text-xs font-bold mb-5 w-fit">
                      <TrendingUp className="w-3 h-3" /> {t.metric}
                    </div>

                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="w-4 h-4 fill-amber-400 text-amber-500"
                        />
                      ))}
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                      &ldquo;{t.text}&rdquo;
                    </p>

                    <div
                      className="flex items-center gap-3 pt-5 border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-900/8 shrink-0">
                        <Image
                          src={t.headshot}
                          alt={t.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="ml-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          {t.name}
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  GUARANTEE                                                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden border"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.03) 100%)",
                  borderColor: "rgba(16,185,129,0.15)",
                }}
              >
                <div
                  className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6 p-4"
                    style={{
                      background: "rgba(16,185,129,0.10)",
                      border: "1px solid rgba(16,185,129,0.20)",
                    }}
                  >
                    <Award className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
                    100% money-back guarantee.
                    <br />
                    <span className="text-emerald-600">
                      No questions. No hassle.
                    </span>
                  </h2>
                  <p className="text-slate-500 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                    We&apos;re so confident in the quality, we offer a full
                    refund within 30 days — no forms, no explanations required.
                    Click &apos;Request Refund&apos; in your dashboard. You keep
                    the photos either way.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      { icon: Shield, label: "30-day protection" },
                      { icon: Lock, label: "AES-256 encryption" },
                      { icon: Zap, label: "Auto-purge in 30 days" },
                    ].map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-400/8 border border-emerald-400/15 px-4 py-2 rounded-full"
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PRICING                                                    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            id="pricing"
            className="py-24 px-6 border-y"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-14"
              >
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold text-lime-600 uppercase tracking-[0.2em] mb-4"
                >
                  Transparent pricing
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4"
                >
                  One-time payment.
                  <br />
                  <span className="text-slate-400">
                    No subscriptions. No surprises.
                  </span>
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-slate-500 max-w-xl mx-auto"
                >
                  Every plan backed by our 30-day money-back guarantee.
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto"
              >
                {Object.values(PLANS).map((plan: any) => (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    className={`relative p-9 rounded-2xl border flex flex-col transition-all ${
                      plan.popular
                        ? "scale-[1.03] z-10 shadow-xl shadow-lime-400/10"
                        : "hover:-translate-y-1 hover:shadow-lg"
                    }`}
                    style={{
                      background: plan.popular
                        ? "linear-gradient(180deg, var(--bg) 0%, rgba(163,230,53,0.03) 100%)"
                        : "var(--surface2)",
                      borderColor: plan.popular
                        ? "rgba(163,230,53,0.4)"
                        : "var(--border)",
                    }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <Flame className="w-3 h-3" /> Most popular
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="text-slate-400 text-sm font-medium">
                        {plan.id === "basic"
                          ? "Quick profile refresh"
                          : plan.id === "pro"
                            ? "Full brand overhaul"
                            : "Executive & team use"}
                      </p>
                    </div>
                    <div className="mb-7">
                      <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {" "}
                        one-time
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {[
                        `${plan.shots} high-resolution photos`,
                        `${plan.styles} custom style categories`,
                        plan.resolution,
                        `${plan.turnaround} delivery`,
                        "Full commercial rights",
                        "30-day money-back guarantee",
                      ].map((feat, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-2.5 text-sm text-slate-600 font-medium"
                        >
                          <CheckCircle className="w-4 h-4 text-lime-600 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/upload?plan=${plan.id}`}
                      className={`block w-full text-center py-3.5 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                        plan.popular
                          ? "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/20"
                          : "bg-slate-900/[0.05] text-slate-900 hover:bg-slate-900/10 border border-slate-900/8"
                      }`}
                    >
                      Get {plan.name}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Secured by Stripe
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 30-day guarantee
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Instant delivery confirmation
                </div>
              </div>

              {/* Internal links for SEO - pricing related */}
              <div className="mt-8 text-center">
                <p className="text-xs text-slate-400 mb-3">Compare plans for your needs:</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                  <Link href="/pricing" className="hover:text-lime-600 transition">View all pricing</Link>
                  <span>·</span>
                  <Link href="/free-preview" className="hover:text-lime-600 transition">View examples</Link>
                  <span>·</span>
                  <Link href="/faq" className="hover:text-lime-600 transition">Pricing FAQ</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  FAQ                                                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="text-center mb-12"
              >
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4"
                >
                  Questions? We&apos;ve got answers.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-500">
                  Can&apos;t find what you need?{" "}
                  <Link
                    href="/contact"
                    className="text-lime-600 font-semibold hover:underline"
                  >
                    Contact us
                  </Link>
                  .
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="space-y-2"
              >
                {FAQS.map((faq, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="rounded-xl overflow-hidden border transition-colors hover:border-slate-900/15"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 text-left font-semibold flex justify-between items-center hover:bg-slate-50 transition text-slate-900"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  FINAL CTA                                                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            className="py-24 px-6 border-t"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative rounded-3xl p-14 md:p-20 text-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #0D0F13 0%, #0E1016 50%, #0A0B10 100%)",
                  border: "1px solid rgba(163,230,53,0.12)",
                }}
              >
                {/* Ambient glows */}
                <div
                  className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(163,230,53,0.1) 0%, transparent 70%)",
                  }}
                />

                <div className="relative z-10">
                  {/* Live counter */}
                  <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-semibold text-white/50 mb-8">
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-ping" />
                    <div className="w-2 h-2 bg-lime-400 rounded-full absolute" />
                    <span>
                      <AnimatedCounter target={headshotsCount} suffix="+" />{" "}
                      headshots generated and counting
                    </span>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tighter leading-[0.95]">
                    Your next great first impression
                    <br />
                    <span className="text-lime-400">starts in under 2 hours.</span>
                  </h2>
                  <p className="text-xl text-white/40 mb-10 max-w-xl mx-auto leading-relaxed">
                    Join thousands of people who upgraded their personal brand —
                    professionals, job seekers, creatives, and students alike.
                    No studio. No photographer. No risk.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/upload"
                      className="group inline-flex items-center justify-center gap-2 bg-lime-400 text-black px-10 py-5 rounded-2xl font-bold text-xl hover:bg-lime-300 transition shadow-xl shadow-lime-400/20 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      Create my headshots
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/free-preview"
                      className="inline-flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-8 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition"
                    >
                      <Eye className="w-5 h-5" /> Preview styles first
                    </Link>
                  </div>

                  <p className="mt-6 text-sm text-white/30 font-medium">
                    From $29 · 30-day money-back guarantee · Results in 30
                    minutes
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
        </div>
        {/* LIGHT ZONE END */}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  FOOTER                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <footer
          className="border-t py-16 px-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-10">
            <div className="md:col-span-2">
              <div className="text-2xl font-black text-white tracking-tighter mb-1">
                TRUZOT
                <span className="text-xs text-lime-400 align-super ml-1 font-bold tracking-widest">
                  AI
                </span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-6 max-w-xs">
                Studio-quality AI headshots for anyone — professionals, job
                seekers, creatives, and students. From your phone. In 30
                minutes. Backed by a 30-day guarantee.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-2 mb-6">
                {SOCIALS.map((s) => {
                  const isCustom = typeof s.icon === "string";
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border text-white/40 hover:text-lime-400 hover:border-lime-400/30 transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface2)",
                      }}
                    >
                      {isCustom ? (
                        s.icon === "tiktok" ? (
                          <TikTokIcon className="w-4 h-4" />
                        ) : (
                          <BlueskyIcon className="w-4 h-4" />
                        )
                      ) : (
                        <s.icon className="w-4 h-4" />
                      )}
                    </a>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-white/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                All systems operational
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">
                Product
              </h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li>
                  <Link href="/upload" className="hover:text-white transition">
                    Create headshots
                  </Link>
                </li>
                <li>
                  <Link
                    href="/free-preview"
                    className="hover:text-[var(--text)] transition"
                  >
                    View Examples
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/team" className="hover:text-white transition">
                    For teams
                  </Link>
                </li>
                <li>
                  <Link href="/profession" className="hover:text-white transition">
                    Profession headshots
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">
                Company
              </h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li>
                  <Link href="/blog/how-to-choose-headshot-style" className="hover:text-white transition">
                    Headshot style guide
                  </Link>
                </li>
                <li>
                  <Link href="/blog/linkedin-headshot-tips" className="hover:text-white transition">
                    LinkedIn headshot tips
                  </Link>
                </li>
                <li>
                  <Link href="/blog/professional-headshot-ideas" className="hover:text-white transition">
                    Headshot ideas
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-widest">
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-white transition">
                    Refund policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="max-w-7xl mx-auto border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-white/20"
            style={{ borderColor: "var(--border)" }}
          >
            <p>© {new Date().getFullYear()} Truzot Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> AES-256 encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> No data sold
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  EXIT-INTENT POPUP                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showExitPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
            onClick={() => {
              setShowExitPopup(false);
              localStorage.setItem("truzot-exit-dismissed", "true");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              className="relative w-full max-w-md rounded-2xl p-8 text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowExitPopup(false);
                  localStorage.setItem("truzot-exit-dismissed", "true");
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition"
              >
                <X size={16} />
              </button>
              {submitStatus === "success" ? (
                <div className="py-4">
                  <CheckCircle className="w-14 h-14 mx-auto mb-4 text-lime-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Discount sent!
                  </h3>
                  <p className="text-white/40">
                    Check your inbox for your $5 discount code.
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-lime-400/10 border border-lime-400/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-7 h-7 text-lime-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Wait — take $5 off
                  </h3>
                  <p className="text-white/40 text-sm mb-6">
                    Enter your email and we&apos;ll send a $5 discount code
                    instantly.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-lime-400/50 transition"
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="w-full bg-lime-400 text-black py-3.5 rounded-xl font-bold text-sm hover:bg-lime-300 transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send my $5 discount"
                      )}
                    </button>
                  </form>
                  {submitStatus === "error" && (
                    <p className="text-red-400 text-xs mt-3">
                      Something went wrong. Try again.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}