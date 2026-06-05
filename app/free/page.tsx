"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function FreeGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResults([]);
    }
  };

  const generateFree = async () => {
    if (!file) return;
    setGenerating(true);
    setError("");
    try {
      const zip = (await import("jszip")).default;
      const instance = new zip();
      instance.file("selfie.jpg", file);
      const zipBlob = await instance.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const uploadUrlRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-upload-url",
          filename: `free_${Date.now()}.zip`,
        }),
      });
      if (!uploadUrlRes.ok) {
        const err = await uploadUrlRes.json();
        throw new Error(err.error ?? "Failed to get upload URL");
      }
      const { signedUrl, token, path } = await uploadUrlRes.json();

      const uploadHeaders: Record<string, string> = {
        "x-upsert": "true",
        "content-type": "application/zip",
      };
      if (token) uploadHeaders["authorization"] = `Bearer ${token}`;
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: zipBlob,
        headers: uploadHeaders,
      });
      if (!uploadRes.ok)
        throw new Error("File upload failed. Please try again.");

      const downloadUrlRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-download-url", path }),
      });
      if (!downloadUrlRes.ok) {
        const err = await downloadUrlRes.json();
        throw new Error(err.error ?? "Failed to finalize upload");
      }
      const { zipUrl } = await downloadUrlRes.json();

      const genRes = await fetch("/api/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipUrl }),
      });
      if (!genRes.ok) throw new Error("Generation failed");
      const data = await genRes.json();
      setResults(data.urls.slice(0, 9));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          Try Truzot — See What&apos;s Possible
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">
          See the style variety you&apos;ll get with a paid plan. These are{" "}
          <strong>example headshots</strong> — not AI-generated from your photo.
        </p>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="mb-4 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {preview && (
            <img
              src={preview}
              className="max-w-[200px] mx-auto mt-4 rounded-xl"
              alt="Preview"
            />
          )}
          {file && !generating && (
            <button
              onClick={generateFree}
              className="mt-6 bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition"
            >
              Show Example Styles
            </button>
          )}
          {generating && <p className="mt-6 text-slate-500">Processing...</p>}
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
          {results.length > 0 && (
            <div className="mt-8">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-300">
                ⚠️ These are <strong>example headshot styles</strong> from stock
                photos, not AI-generated from your image. When you purchase a
                paid plan, we train a custom AI model on your face to produce
                real headshots that look like you.
              </div>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
                Example styles you&apos;ll get with paid plans:
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {results.map((url, idx) => (
                  <div key={idx} className="text-center">
                    <img
                      src={url}
                      className="w-full rounded-xl"
                      alt={`example style ${idx + 1}`}
                    />
                    <span className="text-xs text-slate-500">
                      Example style
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/upload?plan=basic"
                className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Get real AI headshots of yourself from $29 →
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
