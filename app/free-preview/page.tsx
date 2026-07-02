"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Sparkles, UploadCloud, X, Camera } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setUrls([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generatePreviews = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", uploadedImage);

      const res = await fetch("/api/free-preview", {
        method: "POST",
        body: formData,
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
          <div className="w-24" /> {/* Spacer for center alignment */}
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
            See AI headshot styles with your photo
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
            Upload a single selfie and we'll generate low-quality preview samples showing different professional styles. 
            No AI training required — just quick style previews.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          {!imagePreview ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-3xl p-12 text-center cursor-pointer hover:border-[var(--lime-border)] hover:bg-[var(--surface2)] transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text)] font-semibold mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                PNG, JPG up to 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden border border-[var(--border)]">
                <img
                  src={imagePreview}
                  alt="Uploaded preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={removeImage}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={generatePreviews}
                disabled={loading}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--lime)] text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Previews
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-2xl p-6 text-center mb-8 max-w-2xl mx-auto">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-[var(--text)] mb-6 text-center">
              Your Style Previews
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <p className="text-white/70 text-xs mt-1">Low-quality preview</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Regenerate Button */}
            <div className="text-center mt-8">
              <button
                onClick={generatePreviews}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--surface3)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Regenerate Previews
              </button>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {urls.length > 0 && (
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
              Create Your Professional Headshots
            </Link>
            <p className="text-[var(--text-muted)] text-sm mt-4">
              Train an AI model on your face and generate high-quality professional headshots
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
