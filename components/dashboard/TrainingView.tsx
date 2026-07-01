"use client";
import { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  Loader2,
  Cpu,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

interface ProgressData {
  progress: number;
  status?: string;
  queuePosition?: number;
  step?: number;
  total?: number;
}

const AI_STEPS = [
  { threshold: 0, text: "Initializing secure rendering cluster..." },
  { threshold: 10, text: "Analyzing facial geometry and landmarks..." },
  { threshold: 30, text: "Mapping skin textures and lighting profiles..." },
  { threshold: 50, text: "Training Low-Rank Adaptation (LoRA) weights..." },
  { threshold: 80, text: "Refining neural network parameters..." },
  { threshold: 95, text: "Finalizing custom AI model..." },
];

export default function TrainingView({ order }: { order: Order }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`/api/training/progress?orderId=${order.id}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setProgress(data);
        }
      } catch {
        // ignore
      }
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order.id]);

  const progressPct = progress?.progress ?? 0;
  const progressStatus = progress?.status;

  const currentStepIndex =
    AI_STEPS.findLastIndex((s) => progressPct >= s.threshold) || 0;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-[#0E1016] rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-12 max-w-3xl mx-auto mt-12 relative overflow-hidden">
      {/* Background ambient glow — lime */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 border-b border-white/10 pb-10 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime-400/10 text-lime-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Cpu className="w-4 h-4" /> System Active
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Training AI Model
          </h2>
          <p className="text-white/40 font-medium">
            Teaching the neural network your exact facial features. (ETA: ~15 mins)
          </p>
        </div>
        <div className="mt-6 md:mt-0 w-24 h-24 bg-lime-400/10 border border-lime-400/20 rounded-full flex items-center justify-center relative shadow-inner shrink-0">
          <div className="absolute inset-0 border-[6px] border-transparent border-t-lime-400 rounded-full animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-2 border-[4px] border-transparent border-l-indigo-400 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
          <span className="text-2xl font-black text-white relative z-10">
            {progressPct}%
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-8 shadow-inner border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-lime-500 via-lime-400 to-lime-500 rounded-full transition-all duration-700 relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* AI Logs Terminal */}
        <div className="bg-[#07080A] border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-inner mb-8">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-white/30 uppercase tracking-widest font-sans font-bold">
              Process Log
            </span>
          </div>
          <div className="space-y-3">
            {AI_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 transition-opacity duration-300 ${isFuture ? "opacity-30" : "opacity-100"}`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-lime-400 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/20 shrink-0" />
                  )}
                  <span
                    className={`${isCurrent ? "text-lime-400 font-semibold" : isPast ? "text-emerald-400/70" : "text-white/30"}`}
                  >
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          {progressStatus === "in_queue" && progress?.queuePosition && (
            <div className="mt-4 pt-4 border-t border-white/10 text-amber-400 text-xs animate-pulse">
              &gt; Waiting in high-priority GPU queue (Position:{" "}
              {progress.queuePosition})...
            </div>
          )}
          {progressStatus === "in_progress" && progress?.step && progress?.total && (
            <div className="mt-4 pt-4 border-t border-white/10 text-lime-400 text-xs font-bold">
              &gt; Executing tensor step {progress.step} / {progress.total}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 text-sm text-white/40 bg-white/5 py-2 px-4 rounded-2xl">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>
            You can safely close this window. We&apos;ll email you at{" "}
            <strong className="text-white">{order.email || "your address"}</strong>.
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="shrink-0 inline-flex items-center gap-2 bg-white/5 text-white/70 border border-white/10 px-5 py-2.5 rounded-2xl font-bold hover:bg-white/10 transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying..." : "Force Retry"}
        </button>
      </div>
    </div>
  );
}