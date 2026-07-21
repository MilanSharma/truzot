"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Sparkles, Upload, X, ArrowRight, Camera, ChevronDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";

export default function FreePreviewPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    id?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          email: session.user.email,
          id: session.user.id,
          user_metadata: session.user.user_metadata,
        });
      }
      setAuthLoading(false);
    };
    loadUser();
  }, []);
  
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
      if (file.size > 4 * 1024 * 1024) {
        setError("File is too large. Maximum size is 4MB.");
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
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] flex flex-col relative overflow-hidden">
      <Nav user={user} />

      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 w-full">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-[var(--lime-dim)] border border-[var(--lime-border)] text-[var(--lime-text)] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            No Account Required
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-[var(--text)] mb-4 tracking-tighter">
            See your AI headshot. <span className="text-[var(--text-faint)]">Instantly.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
            Upload a selfie and get a free low-resolution watermarked preview of what our AI can do. Custom styles, outfits, and hairstyles.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - 5 cols (Steps) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upload Area */}
            <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-6 lg:p-8 shadow-sm transition-all ${previewUrl ? 'opacity-80 hover:opacity-100' : 'ring-1 ring-[var(--lime-border)] shadow-[var(--shadow-lime)]'}`}>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Camera className="w-5 h-5 text-[var(--lime-text)]" /> 1. Upload your selfie</span>
                {previewUrl && <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />}
              </h3>
              
              {!previewUrl ? (
                <label className="border-2 border-dashed border-[var(--border)] bg-[var(--surface2)] hover:bg-[var(--surface3)] hover:border-[var(--lime-border)] transition-all rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer group">
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
                  <span className="text-sm text-[var(--text-muted)] font-medium">JPG, PNG, WebP up to 4MB</span>
                </label>
              ) : (
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-[var(--border)] shadow-md">
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
            <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-6 lg:p-8 shadow-sm transition-all ${!previewUrl ? 'opacity-50 pointer-events-none' : previewUrl && !emailSubmitted ? 'ring-1 ring-[var(--lime-border)]' : ''}`}>
              <h3 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--lime-text)]" /> 2. Customize your look
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Style & Background</label>
                  <div className="relative">
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full appearance-none bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-2 focus:ring-[var(--lime-dim)] focus:border-[var(--lime-text)] transition-all font-semibold shadow-sm"
                    >
                      {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Outfit</label>
                  <div className="relative">
                    <select
                      value={outfit}
                      onChange={(e) => setOutfit(e.target.value)}
                      className="w-full appearance-none bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-2 focus:ring-[var(--lime-dim)] focus:border-[var(--lime-text)] transition-all font-semibold shadow-sm"
                    >
                      {OUTFITS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Hairstyle</label>
                  <div className="relative">
                    <select
                      value={hairstyle}
                      onChange={(e) => setHairstyle(e.target.value)}
                      className="w-full appearance-none bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:ring-2 focus:ring-[var(--lime-dim)] focus:border-[var(--lime-text)] transition-all font-semibold shadow-sm"
                    >
                      {HAIRSTYLES.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Capture */}
            {!emailSubmitted ? (
              <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-6 lg:p-8 shadow-sm transition-all ${(!previewUrl) ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--lime-text)]" /> 3. Get your results
                </h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] text-sm rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[var(--lime-dim)] focus:border-[var(--lime-text)] transition-all font-semibold shadow-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] px-6 py-4 rounded-xl font-bold hover:bg-[var(--surface3)] transition-colors shadow-sm"
                  >
                    Continue
                  </button>
                  <p className="text-xs text-[var(--text-faint)] text-center font-medium">
                    We&apos;ll email you your preview and special offers
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-[2rem] p-6 shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--lime-text)]" />
                <span className="text-[var(--lime-text)] font-bold">Ready to generate</span>
              </div>
            )}

            <button
              onClick={generatePreview}
              disabled={loading || !imageFile || !emailSubmitted}
              className="w-full bg-[var(--lime)] text-[var(--lime-on)] rounded-2xl py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-[var(--shadow-lime)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Rendering...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Free Preview</>
              )}
            </button>
            {error && (
              <p className="text-red-600 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 p-3 rounded-xl text-sm font-semibold text-center mt-2">{error}</p>
            )}
          </div>

          {/* Right Column - 7 cols (Result) */}
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-6 lg:p-10 shadow-sm flex flex-col items-center justify-center min-h-[500px] h-full relative overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                {/* Scanner effect over uploaded image */}
                {previewUrl && (
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg border border-[var(--border)] mb-4 opacity-50 blur-sm">
                    <Image src={previewUrl} alt="Scanning" fill className="object-cover" />
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-[var(--lime)] shadow-[0_0_30px_var(--lime)] z-20"
                    />
                  </div>
                )}
                <p className="text-[var(--text)] font-bold text-xl mt-4">AI is rendering...</p>
                <p className="text-[var(--text-muted)] text-sm">Usually takes 5-10 seconds.</p>
              </div>
            ) : resultUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-md border-4 border-[var(--border)]">
                  <Image src={resultUrl} alt="Generated Preview" fill className="object-cover" unoptimized />
                </div>
                
                <div className="mt-8 text-center bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-sm">
                  <h4 className="text-xl font-black text-[var(--text)] mb-2 tracking-tight">Like what you see?</h4>
                  <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                    This is just a quick, low-res preview. Upgrade to get a custom AI model trained exactly on your face for ultra-realistic, high-resolution results without watermarks.
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
              <div className="text-center opacity-80">
                <div className="w-20 h-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-5 border border-[var(--border)]"><Sparkles className="w-8 h-8 text-[var(--text-muted)]" /></div>
                <h4 className="text-xl font-bold text-[var(--text)] mb-2">Your preview will appear here</h4>
                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">Upload a selfie and hit generate to see a free low-resolution sample.</p>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
