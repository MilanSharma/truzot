"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Zap, Shield } from "lucide-react";
import type { Order } from "@/lib/types";

const TRAINING_STEPS = [
  "Provisioning neural network accelerators...",
  "Analyzing portrait shapes and biological dimensions...",
  "Applying generative lighting layers on 3D coordinate grid...",
  "Training individual LoRA model values using Flux checkpoints...",
  "Injecting tailored corporate and creative prompts...",
  "Finalizing rendering outputs and applying upscaling...",
];

export default function TrainingView({ order }: { order: Order }) {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setLogIndex((prev) => (prev + 1) % TRAINING_STEPS.length),
      6000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Training AI Model
          </h2>
          <p className="text-sm text-slate-500">
            Learning your facial topography (ETA: ~15 mins)
          </p>
        </div>
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          <span>Live Pipeline Status</span>
          <span className="text-blue-600 animate-pulse">Running...</span>
        </div>
        {TRAINING_STEPS.map((step, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 transition-all duration-500 ${idx === logIndex ? "opacity-100 translate-x-2" : idx < logIndex ? "opacity-50" : "opacity-20"}`}
          >
            {idx < logIndex ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : idx === logIndex ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
            )}
            <span
              className={`text-sm ${idx === logIndex ? "font-bold text-blue-900" : "font-medium text-slate-600"}`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-10 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
        <p>
          You can safely close this window. We&apos;ll send an email to{" "}
          <strong>{order.email}</strong> the moment your high-resolution
          headshots are ready to view.
        </p>
      </div>
    </div>
  );
}
