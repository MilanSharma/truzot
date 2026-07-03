"use client";
import { useState, useRef } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Upload, Loader2 } from "lucide-react";

interface Score {
  total: number;
  brightness: { score: number; text: string };
  complexity: { score: number; text: string };
  colorCast: { score: number; text: string };
}

export default function LinkedInChecker() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Score | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
  };

  const analyze = () => {
    setAnalyzing(true);
    const img = new Image();
    img.src = image!;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let r = 0,
        g = 0,
        b = 0;
      let brightnessArr = [];

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
        brightnessArr.push(bright);
      }

      const pixels = data.length / 4;
      r /= pixels;
      g /= pixels;
      b /= pixels;

      const avgBrightness = brightnessArr.reduce((a, b) => a + b, 0) / pixels;

      // Simplistic variance for background complexity (sampling edges)
      let edgeVariance = 0;
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const bright = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          edgeVariance += Math.abs(bright - avgBrightness);
        }
      }
      edgeVariance /= canvas.width * 10;

      // Calculate scores
      let brightScore = 100 - Math.abs(avgBrightness - 150); // ideal ~150
      brightScore = Math.max(0, Math.min(100, brightScore));

      let colorScore = 100 - Math.abs(r - b) * 1.5; // penalize heavy color casts
      colorScore = Math.max(0, Math.min(100, colorScore));

      let complexScore = 100 - edgeVariance * 2; // penalize high variance on edges
      complexScore = Math.max(0, Math.min(100, complexScore));

      const total = Math.round((brightScore + colorScore + complexScore) / 3);

      setTimeout(() => {
        setResult({
          total,
          brightness: {
            score: Math.round(brightScore),
            text:
              brightScore > 80
                ? "Perfect lighting"
                : brightScore > 50
                  ? "A bit too dark/bright"
                  : "Poor lighting detected",
          },
          colorCast: {
            score: Math.round(colorScore),
            text: colorScore > 80 ? "Natural colors" : "Color tint detected",
          },
          complexity: {
            score: Math.round(complexScore),
            text:
              complexScore > 80
                ? "Clean background"
                : "Background might be too distracting",
          },
        });
        setAnalyzing(false);
      }, 1500);
    };
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Nav />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[var(--lime)] font-bold uppercase tracking-widest text-xs mb-4">
            Free Tool
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            LinkedIn Photo Analyzer
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Upload your current profile picture for an instant AI analysis of
            lighting, background, and color cast.
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 shadow-[var(--shadow-lg)]">
          {!image ? (
            <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-16 text-center hover:border-[var(--lime-border)] transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-12 h-12 text-[var(--lime)] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Upload your headshot</h3>
              <p className="text-[var(--text-faint)]">
                JPG or PNG. We do not store this image on our servers.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center">
                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[var(--surface2)] mb-6 shadow-xl">
                  <img
                    src={image}
                    alt="Uploaded LinkedIn profile photo for analysis"
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  onClick={() => {
                    setImage(null);
                    setResult(null);
                  }}
                  className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  Upload different photo
                </button>
              </div>

              <div>
                {!result ? (
                  <div className="text-center">
                    {analyzing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-[var(--lime)] animate-spin" />
                        <p className="text-lg font-bold">Analyzing pixels...</p>
                      </div>
                    ) : (
                      <button
                        onClick={analyze}
                        className="btn-primary w-full text-lg py-4"
                      >
                        Analyze Photo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-8">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                      <h3 className="text-2xl font-black">Overall Score</h3>
                      <div
                        className={`text-4xl font-black ${result.total > 80 ? "text-[var(--success)]" : result.total > 50 ? "text-[var(--warning)]" : "text-[var(--error)]"}`}
                      >
                        {result.total}/100
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">Lighting</div>
                          <div className="text-sm text-[var(--text-muted)]">
                            {result.brightness.text}
                          </div>
                        </div>
                        <div className="font-bold">
                          {result.brightness.score}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">Color Balance</div>
                          <div className="text-sm text-[var(--text-muted)]">
                            {result.colorCast.text}
                          </div>
                        </div>
                        <div className="font-bold">
                          {result.colorCast.score}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">
                            Background Cleanliness
                          </div>
                          <div className="text-sm text-[var(--text-muted)]">
                            {result.complexity.text}
                          </div>
                        </div>
                        <div className="font-bold">
                          {result.complexity.score}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[var(--border)]">
                      <Link
                        href="/upload"
                        className="btn-primary w-full flex justify-center text-lg py-4"
                      >
                        Get a 99/100 Headshot — $29
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </main>
      <Footer />
    </div>
  );
}
