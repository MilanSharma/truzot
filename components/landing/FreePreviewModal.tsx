"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STYLE_PREVIEWS = [
  {
    id: "corporate",
    name: "Corporate",
    desc: "Navy suit · Neutral background · LinkedIn-ready",
    color: "#1E40AF",
    images: [
      "/shots/girl1 - after.jpeg",
      "/shots/man1 - after.jpeg",
      "/shots/girl3 - after.jpeg",
    ],
  },
  {
    id: "creative",
    name: "Creative Pro",
    desc: "Modern · Editorial · Artistic lighting",
    color: "#7C3AED",
    images: [
      "/shots/girl2 - after.jpeg",
      "/shots/man2- after.jpeg",
      "/shots/man4 - after.jpeg",
    ],
  },
  {
    id: "casual",
    name: "Casual / Outdoor",
    desc: "Natural light · Parks · Relaxed",
    color: "#059669",
    images: [
      "/shots/girl4 - after.jpeg",
      "/shots/man3 - after.jpeg",
      "/shots/man6 - after.jpeg",
    ],
  }
];

export default function FreePreviewModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(STYLE_PREVIEWS[0]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="relative w-full max-w-5xl bg-[#0E1016] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/8">
          <div>
            <p className="text-xs font-bold text-[var(--lime)] uppercase tracking-widest mb-1">Free Style Preview</p>
            <h2 className="text-2xl font-bold text-white">See your headshot styles — before you pay</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[520px]">
          {/* Style tabs */}
          <div className="flex md:flex-col gap-2 p-4 md:p-6 md:w-64 overflow-x-auto md:overflow-x-visible md:border-r border-white/8 shrink-0">
            {STYLE_PREVIEWS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={`flex-shrink-0 text-left px-4 py-3 rounded-xl transition-all ${
                  active.id === s.id
                    ? "bg-white/10 border border-white/15 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-semibold text-sm whitespace-nowrap">{s.name}</span>
                </div>
                <p className="text-xs text-white/40 mt-1 ml-6 hidden md:block leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Preview area */}
          <div className="flex-1 p-6 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: active.color }} />
                  <span className="font-bold text-white text-lg">{active.name}</span>
                  <span className="text-white/40 text-sm">· {active.desc}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {active.images.map((img, i) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden bg-white/5 group">
                      <Image src={img} alt={`${active.name} style sample ${i + 1}`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-xs font-semibold text-white">{active.name} · Style {i + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-white/40 text-sm flex-1">These are sample outputs. Your AI model will be trained specifically on <em>your</em> face.</p>
                  <Link
                    href={`/upload?style=${active.id}`}
                    onClick={onClose}
                    className="shrink-0 bg-[var(--lime)] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition flex items-center gap-2 shadow-[var(--shadow-lime)]"
                  >
                    Get {active.name} looks <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
