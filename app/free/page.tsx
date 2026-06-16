"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import JSZip from "jszip";

import { Lock } from "lucide-react";

function drawWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(w * 0.045)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText("TRUZOT.COM FREE", 0, 0);
  ctx.restore();
}

export default function FreeGenerator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "training" | "done">("upload");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files).slice(0, 5);
    setFiles(incoming);
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    const newUrls = incoming.map((f) => URL.createObjectURL(f));
    objectUrlsRef.current = newUrls;
    setPreviews(newUrls);
    setStep("upload");
    setResultUrl(null);
    setError("");
  };

  const generateFree = useCallback(async () => {
    if (files.length === 0) return;
    setStep("training");
    setError("");

    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const buf = await files[i].arrayBuffer();
        zip.file(`photo_${i + 1}.jpg`, buf);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url" }),
      });
      const { signedUrl, path } = await uploadRes.json();
      if (!signedUrl) throw new Error("Upload URL generation failed");

      await fetch(signedUrl, {
        method: "PUT",
        body: zipBlob,
        headers: { "Content-Type": "application/zip" },
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token)
        authHeaders.Authorization = `Bearer ${session.access_token}`;

      const trainRes = await fetch("/api/free-train", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ storagePath: path }),
      });

      const data = await trainRes.json();
      if (!trainRes.ok) throw new Error(data.error || "Generation failed");

      setResultUrl(data.url);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("upload");
    }
  }, [files]);

  useEffect(() => {
    if (step !== "done" || !resultUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawWatermark(canvas);
    }

    const handleMouseEnter = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const handleMouseLeave = () => drawWatermark(canvas);

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [step, resultUrl]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          Try a Free AI Headshot
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">
          Upload your photos and get <strong>one free headshot</strong>{" "}
          generated with a watermark. No credit card required.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {isAuthenticated === null ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Checking authentication...
            </p>
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto text-center shadow-lg animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
              Account Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Please sign in or create a free account to generate your free AI
              headshot.
            </p>
            <Link
              href="/login?next=/free"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition text-center shadow-md animate-pulse"
            >
              Sign In / Create Account
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center animate-in fade-in duration-500">
            {step === "upload" && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/heic"
                  onChange={handleFiles}
                  className="mb-4 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previews.length > 0 && (
                  <div className="flex gap-3 justify-center mt-4 flex-wrap">
                    {previews.map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        className="w-20 h-20 object-cover rounded-xl"
                        alt={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
                {files.length > 0 && (
                  <button
                    onClick={generateFree}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
                  >
                    Generate My Free Headshot
                  </button>
                )}
              </>
            )}

            {step === "training" && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Training AI model and generating your free headshot...
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  This usually takes 2-3 minutes
                </p>
              </div>
            )}

            {step === "done" && resultUrl && (
              <div>
                <div className="relative max-w-sm mx-auto animate-in zoom-in duration-500">
                  <img
                    ref={imgRef}
                    src={resultUrl}
                    className="w-full rounded-xl shadow-lg"
                    alt="Your free AI headshot"
                    onLoad={() => {
                      if (canvasRef.current && imgRef.current) {
                        const c = canvasRef.current;
                        c.width = imgRef.current.naturalWidth || 400;
                        c.height = imgRef.current.naturalHeight || 500;
                        drawWatermark(c);
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    width={400}
                    height={500}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Hover to preview without watermark.{" "}
                  <strong>Upgrade for watermark-free downloads.</strong>
                </p>
                <Link
                  href="/upload?plan=basic"
                  className="mt-6 inline-block bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition"
                >
                  Remove Watermark — Get Full Access from $29 →
                </Link>
              </div>
            )}
          </div>
        )}

        {step !== "done" && (
          <div className="mt-12 text-center">
            <Link
              href="/upload?plan=basic"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Skip the free version — get full quality headshots from $29 →
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
