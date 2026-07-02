"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Sparkles, Upload, X, ArrowRight, Camera, ChevronDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="min-h-screen bg-[#07080A] font-sans text-white relative overflow-hidden">
      {/* Ambient Dark Theme Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-[#0E1016]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Free Preview</h1>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 text-lime-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            No Account Required
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            See your AI headshot. <span className="text-white/30">Instantly.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            Upload a selfie and get a free low-resolution watermarked preview of what our AI can do. Custom styles, outfits, and hairstyles.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - 5 cols (Steps) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upload Area */}
            <div className={`bg-[#0E1016] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all ${previewUrl ? 'opacity-60 hover:opacity-100' : 'ring-1 ring-lime-400/20 shadow-[0_0_30px_rgba(163,230,53,0.05)]'}`}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Camera className="w-5 h-5 text-lime-400" /> 1. Upload your selfie</span>
                {previewUrl && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
              </h3>
              
              {!previewUrl ? (
                <label className="border-2 border-dashed border-white/15 bg-white/5 hover:bg-white/10 hover:border-lime-400/50 transition-all rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/heic,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 bg-[#07080A] border border-white/10 rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform shadow-sm">
                    <Upload className="w-6 h-6 text-lime-400" />
                  </div>
                  <span className="font-bold text-white text-lg mb-1">Click to upload</span>
                  <span className="text-sm text-white/40 font-medium">JPG, PNG, WebP up to 10MB</span>
                </label>
              ) : (
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                  <Image src={previewUrl} alt="Your selfie" fill className="object-cover" unoptimized />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className={`bg-[#0E1016] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all ${!previewUrl ? 'opacity-40 pointer-events-none' : previewUrl && !emailSubmitted ? 'ring-1 ring-lime-400/20' : ''}`}>
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lime-400" /> 2. Customize your look
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wide">Style & Background</label>
                  <div className="relative">
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full appearance-none bg-[#161820] border border-white/10 text-white text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-1 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all font-medium"
                    >
                      {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wide">Outfit</label>
                  <div className="relative">
                    <select
                      value={outfit}
                      onChange={(e) => setOutfit(e.target.value)}
                      className="w-full appearance-none bg-[#161820] border border-white/10 text-white text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-1 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all font-medium"
                    >
                      {OUTFITS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wide">Hairstyle</label>
                  <div className="relative">
                    <select
                      value={hairstyle}
                      onChange={(e) => setHairstyle(e.target.value)}
                      className="w-full appearance-none bg-[#161820] border border-white/10 text-white text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-1 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all font-medium"
                    >
                      {HAIRSTYLES.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Capture */}
            {!emailSubmitted ? (
              <div className={`bg-[#0E1016] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all ${(!previewUrl) ? 'opacity-40 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lime-400" /> 3. Get your results
                </h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#161820] border border-white/10 text-white text-sm rounded-xl px-4 py-4 outline-none focus:ring-1 focus:ring-lime-400/50 transition-shadow font-medium"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-white/10 text-white border border-white/10 px-6 py-4 rounded-xl font-bold hover:bg-white/15 transition font-medium"
                  >
                    Continue
                  </button>
                  <p className="text-xs text-white/40 text-center">
                    We'll email you your preview and special offers
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-lime-400/10 border border-lime-400/30 rounded-3xl p-6 shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-lime-400" />
                <span className="text-lime-400 font-bold">Ready to generate</span>
              </div>
            )}

            <button
              onClick={generatePreview}
              disabled={loading || !imageFile || !emailSubmitted}
              className="w-full bg-lime-400 text-black rounded-2xl py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.15)] hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Rendering...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Free Preview</>
              )}
            </button>
            {error && (
              <p className="text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-sm font-semibold text-center mt-2">{error}</p>
            )}
          </div>

          {/* Right Column - 7 cols (Result) */}
          <div className="lg:col-span-7 bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[500px] h-full relative overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                {/* Scanner effect over uploaded image */}
                {previewUrl && (
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 mb-4 opacity-50 blur-sm">
                    <Image src={previewUrl} alt="Scanning" fill className="object-cover" />
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-lime-400 shadow-[0_0_30px_rgba(163,230,53,1)] z-20"
                    />
                  </div>
                )}
                <p className="text-white font-bold text-xl mt-4">AI is rendering...</p>
                <p className="text-white/40 text-sm">Usually takes 5-10 seconds.</p>
              </div>
            ) : resultUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/10">
                  <Image src={resultUrl} alt="Generated Preview" fill className="object-cover" unoptimized />
                </div>
                
                <div className="mt-8 text-center bg-[#161820] border border-white/10 rounded-2xl p-6 w-full max-w-md">
                  <h4 className="text-xl font-black text-white mb-2 tracking-tight">Like what you see?</h4>
                  <p className="text-sm text-white/40 mb-6 leading-relaxed">
                    This is just a quick, low-res preview. Upgrade to get a custom AI model trained exactly on your face for ultra-realistic 4K results without watermarks.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex w-full items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition shadow-lg active:scale-95"
                  >
                    Get 40+ HD Headshots <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="text-center opacity-50">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/10"><Sparkles className="w-8 h-8 text-white/50" /></div>
                <h4 className="text-xl font-bold text-white mb-2">Your preview will appear here</h4>
                <p className="text-sm text-white/50 max-w-xs mx-auto">Upload a selfie and hit generate to see a free low-resolution sample.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
