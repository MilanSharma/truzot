"use client";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Lock,
  Star,
  Zap,
  Camera,
  Sparkles,
  ChevronDown,
  Users,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

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
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

export default function HeroSection({
  generatingCount,
  GALLERY_IMAGES,
  AVATARS,
  onPreviewOpen,
}: any) {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-32 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 gap-1 opacity-15 pointer-events-none overflow-hidden filter grayscale-[0.3]">
        {GALLERY_IMAGES.map((img: any, i: number) => (
          <motion.div
            key={i}
            className="relative overflow-hidden bg-[var(--surface2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.8 }}
          >
            <Image
              src={img.src}
              alt={img.label}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={i < 12}
            />
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-[var(--bg)]/80 to-[var(--bg)]" />

      <motion.div
        style={{ y: heroY }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-[var(--surface2)] border border-[var(--border)] rounded-full px-4 py-2 text-sm font-bold text-[var(--text-muted)] mb-8 shadow-[var(--shadow-sm)]"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--lime)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--lime)]"></span>
          </span>
          Generating {generatingCount} headshots right now...
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[0.92] mb-6"
        >
          Studio headshots.
          <br />
          <span className="text-[var(--lime)]">30 minutes.</span>
          <br />
          <span className="text-[var(--text-faint)]">From your phone.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Upload <strong className="text-[var(--text)]">1–5 selfies</strong>.
          Our AI trains a private model on your face and delivers{" "}
          <strong className="text-[var(--text)]">
            40–150 photorealistic headshots
          </strong>{" "}
          in every style you need.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
        >
          <Link
            href="/upload"
            className="w-full sm:w-auto btn-primary text-lg flex items-center justify-center gap-2"
          >
            Create my headshots — $29 <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/examples"
            className="w-full sm:w-auto btn-secondary text-lg flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5 text-[var(--text-muted)]" /> See 200+
            examples
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-sm text-[var(--text-faint)] font-bold"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[var(--success)]" /> 30-day
            money-back
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[var(--success)]" /> AES-256 encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[var(--success)]" /> Auto-purge in
            30 days
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
