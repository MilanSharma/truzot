"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Sparkles, Upload, X, ArrowRight, Camera } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FreePreviewPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  const [style, setStyle] = useState("Corporate office");
  const [outfit, setOutfit] = useState("Business suit");
  const [hairstyle, setHairstyle] = useState("Neat and professional");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const STYLES = ["Corporate office", "Creative studio", "Outdoor park", "Modern startup office", "Neutral grey background"];
  const OUTFITS = ["Business suit", "Smart casual blazer", "Turtleneck", "Plain T-shirt", "Formal dress"];
  const HAIRSTYLES = ["Neat and professional", "Natural", "Styled up", "Slicked back"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setError(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit email");
      }
      
      setEmailSubmitted(true);
      setError(null);
    } catch (err) {
      setError("Failed to submit email. Please try again.");
    }
  };

  const generatePreview = async () => {
    if (!imageFile) {
      setError("Please upload a photo first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("style", style);
      formData.append("outfit", outfit);
      formData.append("hairstyle", hairstyle);

      const res = await fetch("/api/free-preview", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Failed to generate preview");
      }
      
      const data = await res.json() as { url: string };
      setResultUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-lg font-bold text-[var(--text)] tracking-tight">Free Preview</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[var(--lime-dim)] border border-[var(--lime-border)] text-[var(--lime-text)] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            No Account Required
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] mb-4 tracking-tighter">
            See your AI headshot. <span className="text-[var(--text-faint)]">Instantly.</span>
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
            Upload a selfie and get a free low-resolution watermarked preview of what our AI can do. Custom styles, outfits, and hairstyles.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          
          {/* Left Column - Input */}
          <div className="space-y-6">
            
            {/* Upload Area */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[var(--lime)]" /> 1. Upload your selfie
              </h3>
              
              {!previewUrl ? (
                <label className="border-2 border-dashed border-[var(--border-secondary)] bg-[var(--surface2)] hover:bg-[var(--surface3)] hover:border-[var(--lime-border)] transition-colors rounded-2xl flex flex-col items-center justify-center p-12 cursor-pointer group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/heic,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 bg-[var(--bg)] border border-[var(--border)] rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform shadow-sm">
                    <Upload className="w-6 h-6 text-[var(--lime-text)]" />
                  </div>
                  <span className="font-bold text-[var(--text)] text-lg mb-1">Click to upload</span>
                  <span className="text-sm text-[var(--text-muted)] font-medium">JPG, PNG, WebP up to 10MB</span>
                </label>
              ) : (
                <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                  <Image src={previewUrl} alt="Your selfie" fill className="object-cover" unoptimized />
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm opacity-100 transition-opacity">
              <h3 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--lime)]" /> 2. Customize your look
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Style & Background</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--lime-border)] transition-shadow font-medium"
                  >
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Outfit</label>
                  <select
                    value={outfit}
                    onChange={(e) => setOutfit(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--lime-border)] transition-shadow font-medium"
                  >
                    {OUTFITS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Hairstyle</label>
                  <select
                    value={hairstyle}
                    onChange={(e) => setHairstyle(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--lime-border)] transition-shadow font-medium"
                  >
                    {HAIRSTYLES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Email Capture */}
            {!emailSubmitted ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--lime)]" /> 3. Get your results
                </h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--lime-border)] transition-shadow font-medium"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--surface3)] transition font-medium"
                  >
                    Continue
                  </button>
                  <p className="text-xs text-[var(--text-muted)] text-center">
                    We'll email you your preview and special offers
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-3xl p-6 shadow-sm">
                <p className="text-[var(--lime-text)] font-bold text-center">
                  ✓ Email confirmed! Ready to generate.
                </p>
              </div>
            )}

            <button
              onClick={generatePreview}
              disabled={loading || !imageFile || !emailSubmitted}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[var(--shadow-lime)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Generating Preview...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Free Preview</>
              )}
            </button>
            {error && (
              <p className="text-red-500 text-sm font-semibold text-center mt-2">{error}</p>
            )}
          </div>

          {/* Right Column - Result */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 lg:p-10 shadow-sm flex flex-col items-center justify-center min-h-[500px] h-full relative overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[var(--lime)] rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[var(--lime-text)]" />
                  </div>
                </div>
                <p className="text-[var(--text)] font-bold text-lg">AI is working its magic...</p>
                <p className="text-[var(--text-muted)] text-sm">Usually takes 5-10 seconds.</p>
              </div>
            ) : resultUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center"
              >
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                  <Image src={resultUrl} alt="Generated Preview" fill className="object-cover" unoptimized />
                </div>
                
                <div className="mt-8 text-center bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-6 w-full">
                  <h4 className="text-xl font-black text-[var(--text)] mb-2 tracking-tight">Like what you see?</h4>
                  <p className="text-sm text-[var(--text-muted)] mb-5">
                    This is just a quick, low-res preview. Upgrade to get a custom AI model trained exactly on your face for ultra-realistic 4K results without watermarks.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex w-full items-center justify-center gap-2 bg-[var(--text)] text-[var(--bg)] px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-lg active:scale-95"
                  >
                    Get 40+ HD Headshots <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="text-center opacity-50">
                <ImagePlus className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <h4 className="text-lg font-bold text-[var(--text)]">Your preview will appear here</h4>
                <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xs mx-auto">Upload a selfie and click generate to see a free sample.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ImagePlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
      <line x1="16" x2="22" y1="5" y2="5" />
      <line x1="19" x2="19" y1="2" y2="8" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
