"use client";
import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

export default function CustomUpsellModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [clothing, setClothing] = useState("Business Suit (Corporate)");
  const [background, setBackground] = useState("Modern Corporate Office");
  const [loading, setLoading] = useState(false);

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
      else alert(data.error || "Failed to create checkout");
    } catch (err) {
      alert("An error occurred.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Custom Studio Pack
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Need a specific look? Generate{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            20 custom headshots
          </span>{" "}
          tailored to your exact preferences for just{" "}
          <span className="font-bold text-emerald-600">$14</span>.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Clothing & Attire
            </label>
            <select
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Business Suit (Corporate)</option>
              <option>Smart Casual Blazer</option>
              <option>Creative Turtleneck</option>
              <option>Tech Startup Casual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Background Vibe
            </label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Modern Corporate Office</option>
              <option>Clean Studio Grey</option>
              <option>Outdoor Urban City</option>
              <option>Cozy Library / Academic</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Unlock Custom Pack — $14
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">
          Powered by your existing trained AI model. Delivered in ~10 minutes.
        </p>
      </div>
    </div>
  );
}
