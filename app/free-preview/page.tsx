"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const PROMPTS = [
  "A professional corporate headshot, studio lighting, neutral background",
  "A creative headshot, soft natural light, slight smile",
  "A casual professional headshot, outdoor blurred background",
];

const PROMPT_LABELS = [
  "Corporate Style",
  "Creative Style", 
  "Casual Style"
];

export default function FreePreviewPage() {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generatePreviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/free-preview", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Failed to generate previews");
      }
      const data = await res.json() as { urls: string[] };
      setUrls(data.urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate previews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePreviews();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-xl font-bold text-[var(--text)]">Free Style Preview</h1>
          <button
            onClick={generatePreviews}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[var(--lime)] text-black px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[var(--lime-dim)] border border-[var(--lime-border)] text-[var(--lime)] px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            Free Preview — No Payment Required
          </div>
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">
            See AI headshot styles in action
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
            These are sample AI-generated headshots showing different professional styles. 
            When you create your own shoot, your AI model will be trained specifically on your face.
          </p>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-2xl p-6 text-center mb-8">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={generatePreviews}
              className="mt-4 text-red-400 hover:text-red-300 font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && urls.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {urls.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative aspect-square bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden group"
              >
                <Image
                  src={url}
                  alt={`${PROMPT_LABELS[i]} preview`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{PROMPT_LABELS[i]}</p>
                    <p className="text-white/70 text-xs mt-1">{PROMPTS[i]}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        {!loading && urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-[var(--lime)] text-black px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition shadow-[var(--shadow-lime)]"
            >
              <Sparkles className="w-5 h-5" />
              Create Your Headshots
            </Link>
            <p className="text-[var(--text-muted)] text-sm mt-4">
              Train an AI model on your face and generate professional headshots
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
