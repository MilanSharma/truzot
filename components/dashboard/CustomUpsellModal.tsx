"use client";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import {
  X,
  Sparkles,
  Loader2,
  Briefcase,
  Shirt,
  GraduationCap,
  Coffee,
  Building,
  Monitor,
  TreePine,
  Sunrise,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CustomUpsellModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [clothing, setClothing] = useState("Business Suit");
  const [background, setBackground] = useState("Modern Office");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const CLOTHING_OPTS = [
    { id: "Business Suit", icon: Briefcase },
    { id: "Smart Casual Blazer", icon: Shirt },
    { id: "Creative Turtleneck", icon: GraduationCap },
    { id: "Tech Startup T-Shirt", icon: Coffee },
  ];

  const BG_OPTS = [
    { id: "Modern Office", icon: Building },
    { id: "Clean Studio Grey", icon: Monitor },
    { id: "Outdoor Urban", icon: Sunrise },
    { id: "Cozy Cafe", icon: TreePine },
  ];

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/upsell-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, clothing, background }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Failed to create checkout", "error");
    } catch (err) {
      toast("An error occurred.", "error");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#0E1016] border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition bg-white/5 p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-lime-400/10 border border-lime-400/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-lime-400" />
          </div>
          <h2 className="text-3xl font-black text-white">Create Custom Pack</h2>
        </div>

        <p className="text-white/40 mb-8 text-sm">
          Select your exact preferences. We&apos;ll reuse your trained AI model
          to generate{" "}
          <strong className="text-white">20 custom headshots</strong> for just{" "}
          <strong className="text-lime-400">$14</strong>.
        </p>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-white/40 mb-3 uppercase tracking-widest">
              Attire
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLOTHING_OPTS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = clothing === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setClothing(opt.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-lime-400/10 border-lime-400 text-lime-400 scale-[1.02]"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold text-center leading-tight">
                      {opt.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white/40 mb-3 uppercase tracking-widest">
              Background
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BG_OPTS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = background === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setBackground(opt.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-lime-400/10 border-lime-400 text-lime-400 scale-[1.02]"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold text-center leading-tight">
                      {opt.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-lime-400 text-black py-4 rounded-xl text-lg font-bold hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting to Checkout...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate 20 Custom Photos — $14
            </>
          )}
        </button>
        <p className="text-center text-xs text-white/20 mt-4 font-semibold">
          Delivered in ~10 minutes. No uploading required.
        </p>
      </motion.div>
    </motion.div>
  );
}