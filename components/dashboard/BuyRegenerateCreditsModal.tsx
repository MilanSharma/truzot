"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { X, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const QUANTITIES = [1, 5, 10] as const;

export default function BuyRegenerateCreditsModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState<(typeof QUANTITIES)[number]>(5);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/regenerate-credits/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ orderId, quantity }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Failed to create checkout", "error");
    } catch {
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
        className="bg-[#0E1016] border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
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
            <RefreshCw className="w-6 h-6 text-lime-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Buy Regenerate Credits</h2>
        </div>

        <p className="text-white/40 mb-8 text-sm">
          Not happy with a specific photo? Each regeneration costs{" "}
          <strong className="text-lime-400">$1</strong> and swaps that one photo
          for a fresh take — no need to redo the whole shoot.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {QUANTITIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                quantity === q
                  ? "bg-lime-400/10 border-lime-400 text-lime-400 scale-[1.02]"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              <span className="text-lg font-black">{q}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide">
                {q === 1 ? "credit" : "credits"}
              </span>
              <span className="text-xs mt-1 text-white/40">${q}</span>
            </button>
          ))}
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
            <>Buy {quantity} for ${quantity}</>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
